"use client";

import Link from "next/link";
import useSWR from "swr";
import { AppShell } from "@/components/layout";
import { Button, Card, CardContent, Chip, Spinner } from "@heroui/react";
import { Sparkles, ExternalLink, Plus, Languages } from "lucide-react";
import { ApiKeyStatus } from "@/components/aeo/api-key-status";
import { ScoreGauge } from "@/components/aeo/score-gauge";

interface BrandRow {
  projectId: string;
  name: string;
  url: string;
  industry: string;
  language: string;
  accentColor: string;
  competitorCount: number;
  latestRun: {
    id: string;
    status: string;
    overallScore: number | null;
    completedAt: string | null;
    totalCostUsd: number | null;
  } | null;
}

const INDUSTRY_LABEL: Record<string, string> = {
  "creator-management": "Creator Management",
  "webdesign-agency": "Webdesign",
  saas: "SaaS",
  ecommerce: "E-Commerce",
  "local-business": "Local",
  publisher: "Publisher",
  consulting: "Consulting",
  "agency-general": "Agency",
  other: "Andere",
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AeoBrandsPage() {
  const { data, isLoading } = useSWR<BrandRow[]>("/api/aeo/brands", fetcher);

  return (
    <AppShell
      breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "AEO" }]}
      pageTitle="AEO — Answer Engine Optimization"
      pageDescription="LLM-Citation-Tracking, Wettbewerber-Lücken-Analyse und gebrandete Kundenreports."
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <ApiKeyStatus />
          <Button
            as={Link}
            href="/projects"
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
          >
            AEO an Project anhängen
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !data || data.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 flex flex-col items-center gap-3">
              <Sparkles className="w-10 h-10 text-default-300" />
              <div className="text-sm text-default-600">
                Noch keine Brands mit AEO-Konfiguration.
              </div>
              <p className="text-xs text-default-500 max-w-md">
                Lege oder wähle ein Project und fülle den AEO-Tab — sobald die Branche
                gesetzt ist, erscheint das Project hier.
              </p>
              <Button as={Link} href="/projects" color="primary" size="sm">
                Zu den Projects
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((brand) => (
              <Link
                key={brand.projectId}
                href={`/projects/${brand.projectId}/aeo`}
                className="block group"
              >
                <Card shadow="none" className="border border-default-200 group-hover:border-primary/40 transition-colors h-full">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{brand.name}</h3>
                        <p className="text-xs text-default-500 truncate mt-0.5 flex items-center gap-1">
                          {brand.url.replace(/^https?:\/\//, "")}
                          <ExternalLink className="w-3 h-3" />
                        </p>
                      </div>
                      {brand.latestRun?.overallScore !== null && brand.latestRun?.overallScore !== undefined && (
                        <ScoreGauge score={brand.latestRun.overallScore} size={80} accent={brand.accentColor} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Chip size="sm" variant="flat">
                        {INDUSTRY_LABEL[brand.industry] ?? brand.industry}
                      </Chip>
                      <Chip size="sm" variant="flat" startContent={<Languages className="w-3 h-3" />}>
                        {brand.language.toUpperCase()}
                      </Chip>
                      <Chip size="sm" variant="flat">
                        {brand.competitorCount} Wettbewerber
                      </Chip>
                    </div>
                    <div className="text-xs text-default-500 flex justify-between border-t border-default-100 pt-2 mt-1">
                      <span>
                        {brand.latestRun
                          ? `Letzter Lauf: ${brand.latestRun.status}`
                          : "Noch kein Lauf"}
                      </span>
                      {brand.latestRun?.totalCostUsd !== null && brand.latestRun?.totalCostUsd !== undefined && (
                        <span>${brand.latestRun.totalCostUsd.toFixed(2)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
