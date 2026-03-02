"use client";

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
import { CATEGORY_CONFIG } from '@/types';
import { FileSearch, RefreshCw } from 'lucide-react';
import type { Audit, AuditCategory, AuditIssue, CategoryType } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AuditDetail extends Audit {
  categories: AuditCategory[];
  issues: AuditIssue[];
}

export default function AuditDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const auditId = params.auditId as string;

  const { data: audit, isLoading, error, mutate } = useSWR<AuditDetail>(
    `/api/audits/${auditId}`,
    fetcher
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

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project?.name ?? 'Project', href: `/projects/${projectId}` },
        { label: `Audit ${audit?.overallScore !== null ? `(${audit?.overallScore})` : ''}` },
      ]}
      pageTitle={`Audit Details`}
      pageDescription={
        audit?.completedAt
          ? `Completed on ${new Date(audit.completedAt).toLocaleDateString()}`
          : 'Audit in progress'
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
      ) : (
        <div className="space-y-6">
          {/* Row 1: Audit Summary */}
          <AuditSummary audit={audit} />

          {/* Row 2: Category Cards */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Category Scores</h3>
            <CategoryCards categories={audit.categories ?? []} />
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
