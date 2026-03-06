import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { audits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/audits/[id]/stream — SSE endpoint for streaming audit progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        try { controller.close(); } catch { /* already closed */ }
      };

      // Verify audit exists
      const audit = await db.query.audits.findFirst({
        where: eq(audits.id, id),
      });

      if (!audit) {
        sendEvent({ type: 'error', message: 'Audit not found' });
        safeClose();
        return;
      }

      // If already completed or failed, send final event immediately
      if (audit.status === 'completed') {
        sendEvent({ type: 'complete', auditId: id, score: audit.overallScore });
        safeClose();
        return;
      }

      if (audit.status === 'failed') {
        sendEvent({ type: 'error', message: audit.errorMessage || 'Audit failed' });
        safeClose();
        return;
      }

      // Poll for status changes every 2 seconds
      let pollCount = 0;
      const maxPolls = 450; // 15 minutes max (450 * 2s)

      const poll = async () => {
        if (pollCount >= maxPolls) {
          sendEvent({ type: 'error', message: 'Stream timeout' });
          safeClose();
          return;
        }

        try {
          const current = await db.query.audits.findFirst({
            where: eq(audits.id, id),
          });

          if (!current) {
            sendEvent({ type: 'error', message: 'Audit not found' });
            safeClose();
            return;
          }

          // Send progress based on status
          if (current.status === 'running') {
            sendEvent({
              type: 'progress',
              status: current.status,
              message: `Audit in progress...`,
              percentage: Math.min(90, pollCount * 3),
            });
          }

          if (current.status === 'completed') {
            sendEvent({
              type: 'complete',
              auditId: id,
              score: current.overallScore,
            });
            safeClose();
            return;
          }

          if (current.status === 'failed') {
            sendEvent({
              type: 'error',
              message: current.errorMessage || 'Audit failed',
            });
            safeClose();
            return;
          }

          pollCount++;

          // Check if client disconnected
          if (request.signal.aborted) {
            safeClose();
            return;
          }

          setTimeout(poll, 2000);
        } catch (error) {
          sendEvent({ type: 'error', message: 'Internal server error' });
          safeClose();
        }
      };

      // Start polling
      sendEvent({ type: 'connected', auditId: id, status: audit.status });
      setTimeout(poll, 2000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
