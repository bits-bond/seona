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

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);

      switch (data.type) {
        case 'connected':
          onProgress({
            percentage: 0,
            stage: 'Connected',
            message: `Connected to audit stream (status: ${data.status})`,
            timestamp: new Date(),
          });
          break;
        case 'progress':
          onProgress({
            percentage: data.percentage ?? 0,
            stage: data.status ?? 'Processing',
            message: data.message ?? 'Audit in progress...',
            timestamp: new Date(),
          });
          break;
        case 'complete':
          onComplete({ auditId: data.auditId });
          eventSource.close();
          break;
        case 'error':
          onError(data.message ?? 'Unknown error');
          eventSource.close();
          break;
      }
    } catch {
      // Ignore malformed messages
    }
  };

  eventSource.onerror = () => {
    onError('Connection lost');
    eventSource.close();
  };

  return () => eventSource.close();
}
