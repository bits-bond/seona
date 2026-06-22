"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, Chip } from "@heroui/react";
import { CheckCircle2, XCircle } from "lucide-react";

interface ApiKeyStatus {
  openai: boolean;
  anthropic: boolean;
  gemini: boolean;
}

export function ApiKeyStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<ApiKeyStatus | null>(null);

  useEffect(() => {
    void fetch("/api/aeo/api-keys")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ openai: false, anthropic: false, gemini: false }));
  }, []);

  if (!status) return null;
  const anySet = status.openai || status.anthropic || status.gemini;

  const Row = ({ label, ok }: { label: string; ok: boolean }) => (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle2 className="w-3 h-3 text-success" />
      ) : (
        <XCircle className="w-3 h-3 text-default-400" />
      )}
      <span className={ok ? "text-default-700" : "text-default-400"}>{label}</span>
      {!ok && <span className="text-default-400 ml-1">— env var fehlt</span>}
    </div>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <Chip size="sm" variant="flat" color={status.openai ? "success" : "default"}>
          OpenAI {status.openai ? "✓" : "—"}
        </Chip>
        <Chip size="sm" variant="flat" color={status.anthropic ? "success" : "default"}>
          Anthropic {status.anthropic ? "✓" : "—"}
        </Chip>
        <Chip size="sm" variant="flat" color={status.gemini ? "success" : "default"}>
          Gemini {status.gemini ? "✓" : "—"}
        </Chip>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold uppercase text-default-500 mb-1">
            LLM-Provider-Keys
          </div>
          <Row label="OPENAI_API_KEY" ok={status.openai} />
          <Row label="ANTHROPIC_API_KEY" ok={status.anthropic} />
          <Row label="GOOGLE_API_KEY" ok={status.gemini} />
          {!anySet && (
            <p className="text-xs text-default-500 mt-2">
              Setze mindestens einen Key in <code className="text-default-700">web/.env</code>{" "}
              und starte den Dev-Server neu. Ohne Keys läuft der Tracking-Lauf im{" "}
              <strong>Dry-Run-Modus</strong> mit Fixture-Antworten ($0 Kosten).
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
