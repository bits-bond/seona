import type { AuditProgress } from './types';

/**
 * Connect to an audit's SSE progress stream.
 * Returns a cleanup function to close the connection.
 */
export function connectAuditStream(
  auditId: string,
  onProgress: (data: AuditProgress) => void,
  onComplete: (data: { auditId: string }) => void,
  onError: (error: string) => void,
): () => void {
  const eventSource = new EventSource(`/api/audits/${auditId}/stream`);

  eventSource.addEventListener('progress', (e) => {
    const data = JSON.parse((e as MessageEvent).data);
    onProgress({
      ...data,
      timestamp: new Date(data.timestamp),
    });
  });

  eventSource.addEventListener('complete', (e) => {
    onComplete(JSON.parse((e as MessageEvent).data));
    eventSource.close();
  });

  eventSource.addEventListener('error', () => {
    onError('Connection lost');
    eventSource.close();
  });

  return () => eventSource.close();
}
