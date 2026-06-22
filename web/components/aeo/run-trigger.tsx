"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, Input } from "@heroui/react";
import { Play, X } from "lucide-react";
import { ApiKeyStatus } from "./api-key-status";

interface Props {
  projectId: string;
  promptCount: number;
  onStarted?: () => void;
  disabled?: boolean;
}

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-default-200 bg-content1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls = "text-xs font-medium text-default-600 mb-1 block";

export function RunTrigger({ projectId, promptCount, onStarted, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [samples, setSamples] = useState(3);
  const [maxSpend, setMaxSpend] = useState(5);
  const [dryRun, setDryRun] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const start = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(`/api/projects/${projectId}/aeo/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samples, maxSpendUsd: maxSpend, dryRun }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error ?? "Run konnte nicht gestartet werden");
      }
      setOpen(false);
      onStarted?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const estimateLow = promptCount * samples * 3 * 0.03;
  const estimateHigh = promptCount * samples * 3 * 0.08;

  return (
    <>
      <Button
        color="primary"
        startContent={<Play className="w-4 h-4" />}
        isDisabled={disabled || promptCount === 0}
        onPress={() => setOpen(true)}
      >
        Tracking-Lauf starten
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-content1 rounded-2xl shadow-2xl border border-default-200 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-default-200">
              <h3 className="text-md font-semibold">Tracking-Lauf konfigurieren</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-default-100"
                aria-label="Schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <ApiKeyStatus />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Samples pro Prompt × Provider</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={samples}
                    onChange={(e) => setSamples(Math.max(1, Math.min(10, Number(e.target.value) || 3)))}
                    min={1}
                    max={10}
                  />
                </div>
                <div>
                  <label className={labelCls}>Budget-Cap (USD)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={maxSpend}
                    onChange={(e) => setMaxSpend(Math.max(1, Number(e.target.value) || 5))}
                    min={1}
                    step={1}
                  />
                </div>
              </div>
              <Card shadow="none" className="border border-default-200">
                <CardContent className="text-xs text-default-600">
                  <div className="flex justify-between">
                    <span>Genehmigte Prompts:</span>
                    <strong>{promptCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>API-Calls (3 Provider):</span>
                    <strong>{promptCount * samples * 3}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Geschätzte Kosten:</span>
                    <strong>
                      ${estimateLow.toFixed(2)} – ${estimateHigh.toFixed(2)}
                    </strong>
                  </div>
                </CardContent>
              </Card>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                />
                <div>
                  <div className="text-sm font-medium">Dry-Run-Modus</div>
                  <div className="text-xs text-default-500">
                    Nutzt Fixture-Antworten, keine echten API-Calls. $0 Kosten — zum Testen
                    des UI-Flows.
                  </div>
                </div>
              </label>
              {error && (
                <Card className="bg-danger-50 border border-danger-200">
                  <CardContent className="text-xs text-danger-700 py-2">{error}</CardContent>
                </Card>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-default-200">
              <Button variant="light" onPress={() => setOpen(false)} isDisabled={submitting}>
                Abbrechen
              </Button>
              <Button color="primary" onPress={start} isLoading={submitting}>
                Lauf starten
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
