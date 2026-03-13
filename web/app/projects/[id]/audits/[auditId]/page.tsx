"use client";

import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Dropdown, DropdownTrigger, DropdownPopover, DropdownMenu, DropdownItem } from '@heroui/react';
import { AppShell } from '@/components/layout';
import { LoadingSkeleton, EmptyState, ChartRadar } from '@/components/ui';
import {
  AuditSummary,
  CategoryCards,
  IssuesTable,
  ReportViewer,
  SubReportTab,
} from '@/components/dashboard';
import { AuditProgressDisplay } from '@/components/audit/audit-progress';
import { parseReportSections } from '@/lib/parse-report-sections';
import { CATEGORY_CONFIG } from '@/types';
import { cn } from '@/lib/utils';
import {
  FileSearch, RefreshCw, Download, FileText, ChevronDown, Loader2,
  LayoutDashboard, Shield, BookOpen, Code2, Database, Zap, Map, Eye, FileBarChart,
} from 'lucide-react';
import type { Audit, AuditCategory, AuditIssue, AuditSubReport, CategoryType } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AuditDetail extends Audit {
  categories: AuditCategory[];
  issues: AuditIssue[];
  subReports: AuditSubReport[];
}

// Preferred tab ordering and icons for sub-reports
const TAB_META: Record<string, { order: number; icon: typeof Shield }> = {
  technical: { order: 1, icon: Shield },
  content: { order: 2, icon: BookOpen },
  on_page: { order: 3, icon: Code2 },
  schema: { order: 4, icon: Database },
  performance: { order: 5, icon: Zap },
  sitemap: { order: 6, icon: Map },
  visual: { order: 7, icon: Eye },
  images: { order: 8, icon: Eye },
  ai_readiness: { order: 9, icon: FileBarChart },
};

function PdfExportDropdown({ auditId }: { auditId: string }) {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleDownload = useCallback(async (type: 'executive' | 'full') => {
    setGenerating(type);
    try {
      const theme = document.documentElement.getAttribute('data-theme') ?? 'dark';
      const res = await fetch(`/api/audits/${auditId}/pdf?type=${type}&theme=${theme}`);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ?? `SEONA_${type}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setGenerating(null);
    }
  }, [auditId]);

  return (
    <Dropdown>
      <DropdownTrigger
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        isDisabled={generating !== null}
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {generating ? 'Generating...' : 'Export PDF'}
        <ChevronDown className="h-3.5 w-3.5" />
      </DropdownTrigger>
      <DropdownPopover>
        <DropdownMenu
          aria-label="PDF export options"
          onAction={(key) => handleDownload(key as 'executive' | 'full')}
        >
          <DropdownItem id="executive" textValue="Executive Summary">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium">Executive Summary</div>
                <div className="text-xs text-default-500">2-5 page overview</div>
              </div>
            </div>
          </DropdownItem>
          <DropdownItem id="full" textValue="Full Technical Report">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-success" />
              <div>
                <div className="text-sm font-medium">Full Technical Report</div>
                <div className="text-xs text-default-500">15-25 page detailed analysis</div>
              </div>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </DropdownPopover>
    </Dropdown>
  );
}

type TabId = 'overview' | 'reports' | string;

export default function AuditDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const auditId = params.auditId as string;
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: audit, isLoading, error, mutate } = useSWR<AuditDetail>(
    `/api/audits/${auditId}`,
    fetcher,
    {
      refreshInterval: (data) =>
        data && (data.status === 'pending' || data.status === 'running') ? 5000 : 0,
    }
  );

  const { data: project } = useSWR(
    projectId ? `/api/projects/${projectId}` : null,
    fetcher
  );

  const categoryTypes = Object.keys(CATEGORY_CONFIG) as CategoryType[];

  const radarData =
    audit?.categories
      ? categoryTypes.map((cat) => {
          const catData = audit.categories.find((c) => c.category === cat);
          return {
            category: CATEGORY_CONFIG[cat].label,
            score: catData?.score ?? 0,
            fullMark: 100,
          };
        })
      : [];

  // Resolve sub-reports: use DB sub-reports if available, otherwise parse from fullReportMd
  const subReportTabs = useMemo(() => {
    const dbReports = audit?.subReports ?? [];
    if (dbReports.length > 0) {
      return [...dbReports].sort((a, b) => {
        const ai = TAB_META[a.slug]?.order ?? 99;
        const bi = TAB_META[b.slug]?.order ?? 99;
        return ai - bi;
      });
    }
    if (audit?.fullReportMd) {
      return parseReportSections(audit.fullReportMd);
    }
    return [];
  }, [audit?.subReports, audit?.fullReportMd]);

  // Build tab list: Overview + sub-reports + Reports
  const tabs = useMemo(() => {
    const list: { id: TabId; label: string; icon: typeof Shield }[] = [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    ];
    for (const report of subReportTabs) {
      const meta = TAB_META[report.slug];
      list.push({
        id: report.slug,
        label: report.title,
        icon: meta?.icon ?? FileBarChart,
      });
    }
    list.push({ id: 'reports', label: 'Reports', icon: FileText });
    return list;
  }, [subReportTabs]);

  const isRunning = audit?.status === 'pending' || audit?.status === 'running';

  // Find current sub-report for active tab
  const activeSubReport = subReportTabs.find((r) => r.slug === activeTab);

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project?.name ?? 'Project', href: `/projects/${projectId}` },
        { label: audit?.overallScore != null ? `Audit (${audit.overallScore})` : 'Audit' },
      ]}
      pageTitle="Audit Details"
      pageDescription={
        audit?.completedAt
          ? `Completed on ${new Date(audit.completedAt).toLocaleDateString()}`
          : isRunning
            ? 'Audit in progress...'
            : 'Audit'
      }
      pageActions={
        audit?.status === 'completed' ? <PdfExportDropdown auditId={auditId} /> : undefined
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" count={7} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSkeleton variant="card" count={4} />
            <LoadingSkeleton variant="chart" />
          </div>
          <LoadingSkeleton variant="table" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-danger text-sm">Failed to load audit details.</p>
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-default-100 hover:bg-default-200 text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : !audit ? (
        <EmptyState
          icon={<FileSearch className="h-12 w-12" />}
          title="Audit not found"
          description="The audit you're looking for doesn't exist or has been removed."
        />
      ) : isRunning ? (
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-6">Audit in Progress</h2>
          <AuditProgressDisplay
            auditId={auditId}
            onComplete={() => mutate()}
          />
        </div>
      ) : (
        <div>
          {/* Tab bar */}
          <div className="border-b border-divider mb-6 overflow-x-auto">
            <div className="flex min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-default-500 hover:text-foreground hover:border-default-300'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <AuditSummary audit={audit} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Category Scores</h3>
                  <CategoryCards categories={audit.categories ?? []} className="grid-cols-2" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Category Radar</h3>
                  <ChartRadar
                    data={radarData}
                    angleKey="category"
                    valueKeys={["score"]}
                    height={300}
                  />
                </div>
              </div>

              <IssuesTable issues={audit.issues ?? []} />
            </div>
          )}

          {activeTab === 'reports' && (
            <ReportViewer
              fullReportMd={audit.fullReportMd}
              actionPlanMd={audit.actionPlanMd}
            />
          )}

          {activeSubReport && (
            <SubReportTab
              title={activeSubReport.title}
              content={activeSubReport.content}
              source={activeSubReport.source}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
