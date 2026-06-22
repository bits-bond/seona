"use client";

import { use, useState } from "react";
import useSWR from "swr";
import { AppShell } from "@/components/layout";
import { Button, Card, CardContent, Spinner } from "@heroui/react";
import { CheckCircle2, ListChecks, Settings2, Sparkles, FileBarChart2, FileText } from "lucide-react";
import { AeoConfigForm, type AeoConfigValue } from "@/components/aeo/config-form";
import { PromptApproval } from "@/components/aeo/prompt-approval";
import { RunTrigger } from "@/components/aeo/run-trigger";
import { RunProgress } from "@/components/aeo/run-progress";
import { ScoreOverview } from "@/components/aeo/score-overview";
import { ActionPlanList } from "@/components/aeo/action-plan-list";
import { ArtifactsPanel } from "@/components/aeo/artifacts-panel";
import { ReportViewer } from "@/components/aeo/report-viewer";
import { CompetitorGaps } from "@/components/aeo/competitor-gaps";
import { TabSwitcher } from "@/components/aeo/tab-switcher";

interface ConfigResponse {
  projectId: string;
  name: string;
  url: string;
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
  hasAeoConfig: boolean;
}

interface PromptRow {
  id: string;
  text: string;
  orderIndex: number;
  isApproved: boolean;
}

interface LatestRunResponse {
  run: {
    id: string;
    status: string;
    overallScore: number | null;
    brandCitationRate: number | null;
    bestCompetitorRate: number | null;
    gapPoints: number | null;
    totalCostUsd: number | null;
    interpretation: string | null;
    completedAt: string | null;
    dryRun?: boolean;
    providers?: string[];
  } | null;
  score: {
    overall: number;
    brandCitationRate: number;
    bestCompetitorRate: number;
    gapPoints: number;
    perProvider: Record<string, number>;
    interpretation: string;
  } | null;
  actionItems: Array<{
    id: string;
    title: string;
    description: string | null;
    severity: "critical" | "high" | "medium" | "low";
    impactScore: number | null;
    effortScore: number | null;
    source: string | null;
  }>;
  recommendations: Array<{
    promptId: string | null;
    competitor: string | null;
    gapDescription: string | null;
    recommendations: string[];
  }>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProjectAeoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: config, mutate: refreshConfig, isLoading: configLoading } = useSWR<ConfigResponse>(
    `/api/projects/${id}/aeo/config`,
    fetcher,
  );
  const { data: prompts } = useSWR<PromptRow[]>(`/api/projects/${id}/aeo/prompts`, fetcher);
  const { data: latest, mutate: refreshLatest } = useSWR<LatestRunResponse>(
    `/api/projects/${id}/aeo/runs/latest`,
    fetcher,
    { refreshInterval: 0 },
  );

  const [savingConfig, setSavingConfig] = useState(false);
  const [tab, setTab] = useState<string>("overview");

  const approvedCount = (prompts ?? []).filter((p) => p.isApproved).length;
  const hasConfig = config?.hasAeoConfig ?? false;
  const hasPrompts = approvedCount > 0;
  const hasRun = !!latest?.run;
  const isRunning = latest?.run?.status === "running" || latest?.run?.status === "pending";

  const handleConfigSave = async (value: AeoConfigValue) => {
    setSavingConfig(true);
    try {
      await fetch(`/api/projects/${id}/aeo/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      await refreshConfig();
    } finally {
      setSavingConfig(false);
    }
  };

  if (configLoading || !config) {
    return (
      <AppShell breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "AEO" }]} pageTitle="AEO">
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </AppShell>
    );
  }

  const TABS = [
    { key: "overview", label: <span className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4" /> Übersicht</span> },
    { key: "config", label: <span className="inline-flex items-center gap-2"><Settings2 className="w-4 h-4" /> Brand-Config</span> },
    { key: "prompts", label: <span className="inline-flex items-center gap-2"><ListChecks className="w-4 h-4" /> Prompts ({approvedCount})</span> },
    { key: "actions", label: <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Maßnahmen ({latest?.actionItems.length ?? 0})</span> },
    { key: "artifacts", label: <span className="inline-flex items-center gap-2"><FileText className="w-4 h-4" /> Artefakte</span> },
    { key: "report", label: <span className="inline-flex items-center gap-2"><FileBarChart2 className="w-4 h-4" /> Kundenbericht</span> },
  ];

  return (
    <AppShell
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: config.name, href: `/projects/${id}` },
        { label: "AEO" },
      ]}
      pageTitle={`AEO · ${config.name}`}
      pageDescription={config.url}
    >
      <div className="flex flex-col gap-4">
        <Stepper hasConfig={hasConfig} hasPrompts={hasPrompts} hasRun={hasRun} />

        {isRunning && <RunProgress projectId={id} onComplete={() => refreshLatest()} />}

        <TabSwitcher tabs={TABS} value={tab} onChange={setTab} />

        <div className="pt-2">
          {tab === "overview" && (
            <div className="flex flex-col gap-4">
              {!hasConfig ? (
                <EmptyConfig onGoConfig={() => setTab("config")} />
              ) : !hasPrompts ? (
                <EmptyPrompts onGoPrompts={() => setTab("prompts")} />
              ) : !hasRun ? (
                <NoRunYet
                  promptCount={approvedCount}
                  projectId={id}
                  onStarted={() => {
                    refreshLatest();
                    setTab("overview");
                  }}
                />
              ) : latest?.score ? (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-sm font-semibold">Letzter Lauf</div>
                      <div className="text-xs text-default-500">
                        {latest.run?.completedAt
                          ? new Date(latest.run.completedAt).toLocaleString("de-DE")
                          : "—"}
                        {latest.run?.dryRun ? " · Dry-Run" : ""}
                        {latest.run?.totalCostUsd
                          ? ` · $${latest.run.totalCostUsd.toFixed(4)}`
                          : ""}
                      </div>
                    </div>
                    <RunTrigger
                      projectId={id}
                      promptCount={approvedCount}
                      onStarted={() => refreshLatest()}
                      disabled={isRunning}
                    />
                  </div>
                  <ScoreOverview
                    score={latest.score}
                    accentColor={config.accentColor}
                    brandName={config.name}
                  />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-semibold">Top-Maßnahmen</h3>
                      <ActionPlanList items={latest.actionItems} maxItems={5} />
                      {latest.actionItems.length > 5 && (
                        <Button variant="light" size="sm" onPress={() => setTab("actions")}>
                          Alle {latest.actionItems.length} Maßnahmen ansehen →
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-semibold">Wettbewerber-Lücken</h3>
                      <CompetitorGaps recommendations={latest.recommendations} />
                    </div>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="text-sm text-default-500 py-6 text-center">
                    Lauf-Daten konnten nicht aus der Datei geladen werden.
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {tab === "config" && (
            <AeoConfigForm initial={config} onSubmit={handleConfigSave} submitting={savingConfig} />
          )}

          {tab === "prompts" && (
            <div className="flex flex-col gap-4">
              {!hasConfig ? (
                <EmptyConfig onGoConfig={() => setTab("config")} />
              ) : (
                <>
                  <PromptApproval projectId={id} />
                  {approvedCount > 0 && (
                    <div className="flex justify-end pt-2 border-t border-default-200">
                      <RunTrigger
                        projectId={id}
                        promptCount={approvedCount}
                        onStarted={() => {
                          refreshLatest();
                          setTab("overview");
                        }}
                        disabled={isRunning}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "actions" && <ActionPlanList items={latest?.actionItems ?? []} />}

          {tab === "artifacts" && (
            hasRun ? (
              <ArtifactsPanel projectId={id} />
            ) : (
              <Card>
                <CardContent className="text-sm text-default-500 py-6 text-center">
                  Artefakte werden beim Tracking-Lauf erzeugt.
                </CardContent>
              </Card>
            )
          )}

          {tab === "report" && (
            hasRun ? (
              <ReportViewer projectId={id} defaultLang={config.language} />
            ) : (
              <Card>
                <CardContent className="text-sm text-default-500 py-6 text-center">
                  Bericht wird verfügbar, sobald ein Tracking-Lauf abgeschlossen ist.
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stepper({
  hasConfig,
  hasPrompts,
  hasRun,
}: {
  hasConfig: boolean;
  hasPrompts: boolean;
  hasRun: boolean;
}) {
  const steps = [
    { label: "Brand-Config", done: hasConfig },
    { label: "Prompts genehmigt", done: hasPrompts },
    { label: "Tracking-Lauf", done: hasRun },
    { label: "Report bereit", done: hasRun },
  ];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border ${
              s.done
                ? "bg-success-100 text-success-700 border-success-200"
                : "bg-default-100 text-default-500 border-default-200"
            }`}
          >
            {s.done ? "✓" : i + 1}
          </div>
          <span className={`text-xs ${s.done ? "text-default-700" : "text-default-500"}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="text-default-300 mx-1">→</span>}
        </div>
      ))}
    </div>
  );
}

function EmptyConfig({ onGoConfig }: { onGoConfig: () => void }) {
  return (
    <Card>
      <CardContent className="text-center py-8 flex flex-col items-center gap-3">
        <Settings2 className="w-8 h-8 text-default-300" />
        <div className="text-sm font-medium">Brand-Config fehlt</div>
        <p className="text-xs text-default-500 max-w-md">
          Fülle Branche, Beschreibung, Services und Wettbewerber aus, damit der Prompt-Generator branchenspezifische Tracking-Anfragen erzeugt.
        </p>
        <Button color="primary" onPress={onGoConfig}>
          Jetzt einrichten
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyPrompts({ onGoPrompts }: { onGoPrompts: () => void }) {
  return (
    <Card>
      <CardContent className="text-center py-8 flex flex-col items-center gap-3">
        <ListChecks className="w-8 h-8 text-default-300" />
        <div className="text-sm font-medium">Prompts genehmigen</div>
        <p className="text-xs text-default-500 max-w-md">
          Lass 10 branchenspezifische Prompts vorschlagen, editiere sie nach Bedarf und genehmige sie für den Tracking-Lauf.
        </p>
        <Button color="primary" onPress={onGoPrompts}>
          Prompts erstellen
        </Button>
      </CardContent>
    </Card>
  );
}

function NoRunYet({
  promptCount,
  projectId,
  onStarted,
}: {
  promptCount: number;
  projectId: string;
  onStarted: () => void;
}) {
  return (
    <Card>
      <CardContent className="text-center py-8 flex flex-col items-center gap-3">
        <Sparkles className="w-8 h-8 text-default-300" />
        <div className="text-sm font-medium">Bereit für den Tracking-Lauf</div>
        <p className="text-xs text-default-500 max-w-md">
          {promptCount} Prompts sind genehmigt. Starte den Lauf, um KI-Citation-Daten zu erfassen.
        </p>
        <RunTrigger projectId={projectId} promptCount={promptCount} onStarted={onStarted} />
      </CardContent>
    </Card>
  );
}
