"use client";

import type { ReactNode } from "react";

interface TabDef {
  key: string;
  label: ReactNode;
}

interface Props {
  tabs: TabDef[];
  value: string;
  onChange: (key: string) => void;
}

export function TabSwitcher({ tabs, value, onChange }: Props) {
  return (
    <div className="border-b border-default-200 flex items-center gap-1 overflow-x-auto">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap ${
              active
                ? "border-primary text-primary font-medium"
                : "border-transparent text-default-500 hover:text-default-900"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
