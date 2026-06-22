"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, Spinner } from "@heroui/react";
import { Plus, RefreshCw, Trash2, Wand2 } from "lucide-react";

interface PromptItem {
  id: string;
  text: string;
}

interface Props {
  projectId: string;
}

const inputCls =
  "flex-1 px-3 py-2 rounded-lg border border-default-200 bg-content1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40";

export function PromptApproval({ projectId }: Props) {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/projects/${projectId}/aeo/prompts`);
      if (r.ok) {
        const data = (await r.json()) as PromptItem[];
        setPrompts(data);
      }
      setLoading(false);
    })();
  }, [projectId]);

  const generate = async () => {
    setGenerating(true);
    setSaveOk(false);
    try {
      const r = await fetch(`/api/projects/${projectId}/aeo/prompts/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10 }),
      });
      if (r.ok) {
        const data = await r.json();
        setPrompts(data.prompts);
        setUsedFallback(data.usedFallback);
      }
    } finally {
      setGenerating(false);
    }
  };

  const updateText = (idx: number, text: string) => {
    setPrompts((cur) => cur.map((p, i) => (i === idx ? { ...p, text } : p)));
    setSaveOk(false);
  };

  const remove = (idx: number) => {
    setPrompts((cur) => cur.filter((_, i) => i !== idx));
    setSaveOk(false);
  };

  const addEmpty = () => {
    setPrompts((cur) => [...cur, { id: `new-${Date.now()}`, text: "" }]);
    setSaveOk(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/aeo/prompts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts: prompts.filter((p) => p.text.trim()) }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      setSaveOk(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  const validCount = prompts.filter((p) => p.text.trim()).length;

  return (
    <div className="flex flex-col gap-3 max-w-4xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <h3 className="text-md font-semibold">Tracking-Prompts</h3>
          <p className="text-xs text-default-500">
            Markenrelevante Anfragen, die gegen alle LLM-Provider gespielt werden.
            Editiere, lösche, ergänze — und genehmige sie unten.
          </p>
        </div>
        <Button
          size="sm"
          variant="flat"
          startContent={<Wand2 className="w-4 h-4" />}
          onPress={generate}
          isLoading={generating}
        >
          {prompts.length === 0 ? "10 Prompts vorschlagen" : "Neu vorschlagen"}
        </Button>
      </div>

      {usedFallback && (
        <div className="px-3 py-2 rounded-lg bg-warning-50 border border-warning-200 text-xs text-warning-800">
          ⚠️ Branchen-Fallback-Templates verwendet (kein OPENAI_API_KEY gesetzt). Setze
          den Key in <code className="mx-1">web/.env</code> und starte den Dev-Server neu für LLM-generierte,
          kontextspezifische Prompts.
        </div>
      )}

      {prompts.length === 0 && !generating && (
        <Card>
          <CardContent className="text-center text-sm text-default-500 py-8">
            Noch keine Prompts. Klick auf <strong>10 Prompts vorschlagen</strong>.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {prompts.map((p, i) => (
          <div key={`${p.id}-${i}`} className="flex items-center gap-2">
            <span className="text-xs text-default-400 w-6 text-right shrink-0">{i + 1}.</span>
            <input
              type="text"
              className={inputCls}
              value={p.text}
              onChange={(e) => updateText(i, e.target.value)}
            />
            <button
              onClick={() => remove(i)}
              className="p-2 rounded-md text-default-400 hover:text-danger hover:bg-danger-50"
              aria-label="Entfernen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
        <Button
          size="sm"
          variant="light"
          startContent={<Plus className="w-4 h-4" />}
          onPress={addEmpty}
        >
          Prompt hinzufügen
        </Button>
        <div className="flex items-center gap-2">
          {saveOk && (
            <span className="text-xs text-success font-medium">✓ Gespeichert</span>
          )}
          <Button
            size="sm"
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={generate}
            isLoading={generating}
          >
            Neu generieren
          </Button>
          <Button size="sm" color="primary" onPress={save} isLoading={saving} isDisabled={validCount === 0}>
            Prompts genehmigen ({validCount})
          </Button>
        </div>
      </div>
    </div>
  );
}
