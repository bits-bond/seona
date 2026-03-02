'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@heroui/react';
import { connectAuditStream } from '@/lib/audit-engine/stream';
import type { AuditProgress } from '@/lib/audit-engine/types';

interface AuditProgressProps {
  auditId: string;
  onComplete: () => void;
}

interface LogEntry {
  timestamp: string;
  message: string;
}

export function AuditProgressDisplay({ auditId, onComplete }: AuditProgressProps) {
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
    };
    setLogs((prev) => [...prev, entry]);
  }, []);

  // Auto-scroll log container
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const cleanup = connectAuditStream(
      auditId,
      (data) => {
        setProgress(data);
        addLog(`[${data.stage}] ${data.message}`);
      },
      () => {
        setIsComplete(true);
        addLog('Audit completed successfully!');
      },
      (errMsg) => {
        setError(errMsg);
        addLog(`Error: ${errMsg}`);
      },
    );

    addLog('Connecting to audit stream...');

    return cleanup;
  }, [auditId, addLog]);

  const percentage = progress?.percentage ?? 0;
  const stage = progress?.stage ?? 'Initializing';

  const barColor = error
    ? 'bg-danger'
    : isComplete
      ? 'bg-success'
      : 'bg-primary';

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{stage}</span>
          <span className="text-sm text-default-500">{percentage}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-default-200 overflow-hidden" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Audit progress">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div
        ref={logContainerRef}
        className="h-64 overflow-y-auto rounded-lg bg-default-100 p-3 font-mono text-xs leading-relaxed"
      >
        {logs.map((log, i) => (
          <div key={i} className="text-default-600">
            <span className="text-default-400 mr-2">{log.timestamp}</span>
            {log.message}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-default-400">Waiting for audit to start...</div>
        )}
      </div>

      {error && (
        <div className="text-danger text-sm">
          Connection lost. The audit may still be running in the background.
        </div>
      )}

      {isComplete && (
        <Button
          variant="primary"
          size="lg"
          onPress={onComplete}
        >
          View Results
        </Button>
      )}
    </div>
  );
}
