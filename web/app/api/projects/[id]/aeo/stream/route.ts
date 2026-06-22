import { NextRequest } from 'next/server';
import { getRunnerProgress, isRunning } from '@/lib/aeo/runner-server';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const sendEvent = (data: Record<string, unknown>) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {}
      };

      const initial = getRunnerProgress(id);
      sendEvent({ type: 'connected', progress: initial });
      if (initial && (initial.status === 'completed' || initial.status === 'failed')) {
        sendEvent({ type: initial.status, progress: initial });
        safeClose();
        return;
      }

      let pollCount = 0;
      const maxPolls = 900; // 30 min @ 2s

      const poll = () => {
        if (closed || request.signal.aborted) {
          safeClose();
          return;
        }
        if (pollCount >= maxPolls) {
          sendEvent({ type: 'timeout', message: 'Stream timeout' });
          safeClose();
          return;
        }
        const p = getRunnerProgress(id);
        if (p) sendEvent({ type: 'progress', progress: p });
        if (p && (p.status === 'completed' || p.status === 'failed')) {
          sendEvent({ type: p.status, progress: p });
          safeClose();
          return;
        }
        if (!p && !isRunning(id) && pollCount > 2) {
          // Nothing running and no progress entry — close cleanly
          sendEvent({ type: 'idle' });
          safeClose();
          return;
        }
        pollCount += 1;
        setTimeout(poll, 1500);
      };

      setTimeout(poll, 1500);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
