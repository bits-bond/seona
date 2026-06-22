"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@heroui/react";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface ProgressEvent {
  status: string;
  stage: string;
  percentage: number;
  message?: string;
  totalCostUsd?: number;
  callsDone?: number;
  callsTotal?: number;
  errorMessage?: string;
}

interface Props {
  projectId: string;
  onComplete?: () => void;
}

export function RunProgress({ projectId, onComplete }: Props) {
  const [progress, setProgress] = useState<ProgressEvent | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/projects/${projectId}/aeo/stream`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.progress) setProgress(data.progress);
        if (data.type === "completed" || data.type === "failed" || data.type === "idle") {
          es.close();
          if (data.type === "completed" && onComplete) setTimeout(() => onComplete(), 500);
        }
      } catch {}
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [projectId, onComplete]);

  if (!progress) {
    return (
      <Card>
        <CardContent className="flex flex-row items-center gap-2 text-sm text-default-500 py-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          Warte auf Tracking-Lauf …
        </CardContent>
      </Card>
    );
  }

  const isError = progress.status === "failed";
  const isDone = progress.status === "completed";
  const barColor = isError ? "bg-danger" : isDone ? "bg-success" : "bg-primary";

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isError ? (
              <AlertTriangle className="w-4 h-4 text-danger" />
            ) : isDone ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
            <span className="text-sm font-medium">{progress.stage || progress.status}</span>
          </div>
          <span className="text-xs text-default-500">{Math.round(progress.percentage)}%</span>
        </div>
        <div className="h-2 bg-default-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300 ease-out`}
            style={{ width: `${Math.max(0, Math.min(100, progress.percentage))}%` }}
          />
        </div>
        {(progress.callsTotal ?? 0) > 0 && (
          <div className="flex items-center justify-between text-xs text-default-500 pt-1">
            <span>
              {progress.callsDone ?? 0} / {progress.callsTotal} Calls
            </span>
            <span>
              {typeof progress.totalCostUsd === "number" ? `$${progress.totalCostUsd.toFixed(4)}` : ""}
            </span>
          </div>
        )}
        {progress.errorMessage && <p className="text-xs text-danger pt-1">{progress.errorMessage}</p>}
      </CardContent>
    </Card>
  );
}
