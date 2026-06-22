"use client";

import { useState } from "react";
import { Button } from "@heroui/react";

export interface AeoConfigValue {
  industry: string;
  description: string;
  services: string[];
  targetCustomer: string;
  region: string;
  aliases: string[];
  competitors: Array<{ domain: string; brandName: string; aliases: string[] }>;
  accentColor: string;
  logoPath: string | null;
  language: "de" | "en";
}

const INDUSTRIES: Array<{ key: string; label: string }> = [
  { key: "creator-management", label: "Creator Management" },
  { key: "webdesign-agency", label: "Webdesign / Agency" },
  { key: "saas", label: "SaaS" },
  { key: "ecommerce", label: "E-Commerce" },
  { key: "local-business", label: "Local Business" },
  { key: "publisher", label: "Publisher" },
  { key: "consulting", label: "Consulting" },
  { key: "agency-general", label: "Agentur (allgemein)" },
  { key: "other", label: "Andere" },
];

interface Props {
  initial?: Partial<AeoConfigValue>;
  onSubmit: (value: AeoConfigValue) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
}

const labelCls = "text-xs font-medium text-default-700 mb-1 block";
const helpCls = "text-[10px] text-default-400 mt-1";
const inputCls =
  "w-full px-3 py-2 rounded-lg border border-default-200 bg-content1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40";

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {help && <p className={helpCls}>{help}</p>}
    </div>
  );
}

export function AeoConfigForm({ initial, onSubmit, submitting, submitLabel = "Speichern" }: Props) {
  const [industry, setIndustry] = useState(initial?.industry ?? "other");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [servicesText, setServicesText] = useState((initial?.services ?? []).join(", "));
  const [targetCustomer, setTargetCustomer] = useState(initial?.targetCustomer ?? "");
  const [region, setRegion] = useState(initial?.region ?? "DACH");
  const [aliasesText, setAliasesText] = useState((initial?.aliases ?? []).join(", "));
  const [competitorsText, setCompetitorsText] = useState(
    (initial?.competitors ?? []).map((c) => c.domain).join(", "),
  );
  const [accentColor, setAccentColor] = useState(initial?.accentColor ?? "#e05a33");
  const [logoPath, setLogoPath] = useState(initial?.logoPath ?? "");
  const [language, setLanguage] = useState<"de" | "en">(initial?.language ?? "de");

  const parseCsv = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const services = parseCsv(servicesText);
    const aliases = parseCsv(aliasesText);
    const competitors = parseCsv(competitorsText).map((domain) => ({
      domain,
      brandName: domain.replace(/^www\./, "").split(".")[0] ?? domain,
      aliases: [],
    }));
    await onSubmit({
      industry,
      description,
      services,
      targetCustomer,
      region,
      aliases,
      competitors,
      accentColor,
      logoPath: logoPath || null,
      language,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Branche *" help="Bestimmt Fallback-Prompts und Prioritäten">
          <select className={inputCls} value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {INDUSTRIES.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sprache">
          <select
            className={inputCls}
            value={language}
            onChange={(e) => setLanguage(e.target.value as "de" | "en")}
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </Field>
      </div>

      <Field label="Beschreibung" help="Fließt direkt in den Prompt-Generator und ins llms.txt">
        <textarea
          className={`${inputCls} min-h-[72px] resize-y`}
          placeholder="1–2 Sätze was die Marke konkret macht"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </Field>

      <Field label="Hauptservices" help="Komma-getrennt">
        <input
          type="text"
          className={inputCls}
          placeholder="z.B. Creator-Management, Brand-Deals, Content-Strategie"
          value={servicesText}
          onChange={(e) => setServicesText(e.target.value)}
        />
      </Field>

      <Field label="Zielkunde">
        <input
          type="text"
          className={inputCls}
          placeholder="z.B. Creator mit 100k+ Followern und Mid-Tier-Brands"
          value={targetCustomer}
          onChange={(e) => setTargetCustomer(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Region / Markt">
          <input
            type="text"
            className={inputCls}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </Field>
        <Field label="Brand-Aliase" help="Alternative Schreibweisen, Komma-getrennt">
          <input
            type="text"
            className={inputCls}
            placeholder="z.B. B&B, bits-and-bond"
            value={aliasesText}
            onChange={(e) => setAliasesText(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Wettbewerber-Domains" help="Komma-getrennt, z.B. comp1.de, comp2.com">
        <input
          type="text"
          className={inputCls}
          placeholder="comp1.de, comp2.com, comp3.de"
          value={competitorsText}
          onChange={(e) => setCompetitorsText(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Akzentfarbe (Hex)">
          <div className="flex items-center gap-2">
            <span
              className="w-9 h-9 rounded-lg border border-default-300 shrink-0"
              style={{ background: accentColor }}
            />
            <input
              type="text"
              className={inputCls}
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
            />
          </div>
        </Field>
        <Field label="Logo-Pfad oder URL">
          <input
            type="text"
            className={inputCls}
            placeholder="z.B. /assets/logo.png oder https://..."
            value={logoPath}
            onChange={(e) => setLogoPath(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" color="primary" isLoading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
