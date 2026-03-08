"use client";

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { AppShell } from '@/components/layout';
import { LoadingSkeleton, EmptyState, ChartBar, ChartRadar } from '@/components/ui';
import {
  AuditSummary,
  CategoryCards,
  IssuesTable,
  ReportViewer,
} from '@/components/dashboard';
import { AuditProgressDisplay } from '@/components/audit/audit-progress';
import { CATEGORY_CONFIG } from '@/types';
import { FileSearch, RefreshCw, Download, FileText, ChevronDown, Loader2 } from 'lucide-react';
import type { Audit, AuditCategory, AuditIssue, CategoryType } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AuditDetail extends Audit {
  categories: AuditCategory[];
  issues: AuditIssue[];
}

function PdfExportDropdown({ auditId }: { auditId: string }) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const handleDownload = useCallback(async (type: 'executive' | 'full') => {
    setGenerating(type);
    setOpen(false);
    try {
      const res = await fetch(`/api/audits/${auditId}/pdf?type=${type}`);
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
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={generating !== null}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {generating ? 'Generating...' : 'Export PDF'}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg border border-divider bg-content1 shadow-lg overflow-hidden">
            <button
              onClick={() => handleDownload('executive')}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-default-100 transition-colors"
            >
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium">Executive Summary</div>
                <div className="text-xs text-default-500">2-5 page overview</div>
              </div>
            </button>
            <button
              onClick={() => handleDownload('full')}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-default-100 transition-colors border-t border-divider"
            >
              <FileText className="h-5 w-5 text-success" />
              <div>
                <div className="text-sm font-medium">Full Technical Report</div>
                <div className="text-xs text-default-500">15-25 page detailed analysis</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AuditDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const auditId = params.auditId as string;

  const { data: audit, isLoading, error, mutate } = useSWR<AuditDetail>(
    `/api/audits/${auditId}`,
    fetcher,
    {
      // Poll every 5s while audit is running/pending
      refreshInterval: (data) =>
        data && (data.status === 'pending' || data.status === 'running') ? 5000 : 0,
    }
  );

  // Fetch project name for breadcrumbs
  const { data: project } = useSWR(
    projectId ? `/api/projects/${projectId}` : null,
    fetcher
  );

  const categoryTypes = Object.keys(CATEGORY_CONFIG) as CategoryType[];

  const categoryChartData =
    audit?.categories
      ? categoryTypes.map((cat) => {
          const catData = audit.categories.find((c) => c.category === cat);
          return {
            name: CATEGORY_CONFIG[cat].label,
            score: catData?.score ?? 0,
          };
        })
      : [];

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

  const isRunning = audit?.status === 'pending' || audit?.status === 'running';

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project?.name ?? 'Project', href: `/projects/${projectId}` },
        { label: audit?.overallScore != null ? `Audit (${audit.overallScore})` : 'Audit' },
      ]}
      pageTitle={`Audit Details`}
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
            <LoadingSkeleton variant="chart" />
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
        <div className="space-y-6">
          {/* Row 1: Audit Summary */}
          <AuditSummary audit={audit} />

          {/* Row 2: Category Cards */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Category Scores</h3>
            <CategoryCards categories={audit.categories ?? []} className="md:grid-cols-3 lg:grid-cols-4" />
          </div>

          {/* Row 3: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Category Comparison</h3>
              <ChartBar
                data={categoryChartData}
                xKey="name"
                yKeys={["score"]}
                height={300}
              />
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

          {/* Row 4: Issues Table */}
          <IssuesTable issues={audit.issues ?? []} />

          {/* Row 5: Report Viewer */}
          <ReportViewer
            fullReportMd={audit.fullReportMd}
            actionPlanMd={audit.actionPlanMd}
          />
        </div>
      )}
    </AppShell>
  );
}
