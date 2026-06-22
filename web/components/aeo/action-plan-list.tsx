"use client";

import { Card, CardContent, Chip } from "@heroui/react";

interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  severity: "critical" | "high" | "medium" | "low";
  impactScore: number | null;
  effortScore: number | null;
  source: string | null;
}

interface Props {
  items: ActionItem[];
  maxItems?: number;
}

const SEVERITY_LABEL: Record<ActionItem["severity"], string> = {
  critical: "Kritisch",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
};

const SEVERITY_COLOR: Record<ActionItem["severity"], "danger" | "warning" | "primary" | "success"> = {
  critical: "danger",
  high: "warning",
  medium: "primary",
  low: "success",
};

const SEVERITY_BORDER: Record<ActionItem["severity"], string> = {
  critical: "border-l-danger",
  high: "border-l-warning",
  medium: "border-l-primary",
  low: "border-l-success",
};

export function ActionPlanList({ items, maxItems }: Props) {
  const shown = maxItems ? items.slice(0, maxItems) : items;
  if (shown.length === 0) {
    return (
      <Card>
        <CardContent className="text-sm text-default-500 py-6 text-center">
          Noch keine Maßnahmen — starte einen Tracking-Lauf, um den Maßnahmenplan zu generieren.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {shown.map((item) => (
        <Card
          key={item.id}
          className={`border-l-4 ${SEVERITY_BORDER[item.severity]}`}
          shadow="none"
        >
          <CardContent className="py-3 px-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{item.title}</div>
                {item.description && (
                  <p className="text-xs text-default-600 mt-1 whitespace-pre-wrap">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Chip size="sm" color={SEVERITY_COLOR[item.severity]} variant="flat">
                  {SEVERITY_LABEL[item.severity]}
                </Chip>
                <div className="text-[10px] text-default-400">
                  Impact {item.impactScore ?? "—"} · Aufwand {item.effortScore ?? "—"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
