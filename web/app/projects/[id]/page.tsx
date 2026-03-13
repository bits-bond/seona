"use client";

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { AppShell } from '@/components/layout';
import { LoadingSkeleton, EmptyState } from '@/components/ui';
import {
  ProjectHeader,
  AuditHistoryTable,
  ScoreTrendChart,
  CategoryCards,
} from '@/components/dashboard';
import { ChartRadar } from '@/components/ui';
import { CATEGORY_CONFIG } from '@/types';
import type { CategoryType } from '@/types';
import { FolderOpen, RefreshCw } from 'lucide-react';
import type { Project, Audit, AuditCategory } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ProjectWithAudits extends Project {
  audits: Audit[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading, error: projectError, mutate } = useSWR<ProjectWithAudits>(
    `/api/projects/${projectId}`,
    fetcher
  );

  const latestCompletedAudit = project?.audits
    ?.filter((a) => a.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const { data: latestAuditDetail } = useSWR(
    latestCompletedAudit ? `/api/audits/${latestCompletedAudit.id}` : null,
    fetcher
  );

  const latestCategories: AuditCategory[] = latestAuditDetail?.categories ?? [];

  const categoryTypes = Object.keys(CATEGORY_CONFIG) as CategoryType[];
  const radarData = latestCategories.length > 0
    ? categoryTypes.map((cat) => {
        const catData = latestCategories.find((c) => c.category === cat);
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
        { label: project?.name ?? 'Project' },
      ]}
      pageTitle={project?.name ?? 'Project Detail'}
      pageDescription={project?.url}
    >
      {projectLoading ? (
        <div className="space-y-6">
          <LoadingSkeleton variant="card" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LoadingSkeleton variant="chart" />
            </div>
            <LoadingSkeleton variant="card" />
          </div>
          <LoadingSkeleton variant="table" />
        </div>
      ) : projectError ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-danger text-sm">Failed to load project.</p>
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-default-100 hover:bg-default-200 text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : !project ? (
        <EmptyState
          icon={<FolderOpen className="h-12 w-12" />}
          title="Project not found"
          description="The project you're looking for doesn't exist or has been removed."
        />
      ) : (
        <div className="space-y-6">
          <ProjectHeader project={project} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {radarData.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Category Radar</h3>
                  <ChartRadar
                    data={radarData}
                    angleKey="category"
                    valueKeys={["score"]}
                    height={300}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-sm text-default-400">
                  No category data available yet.
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Latest Category Scores</h3>
              {latestCategories.length > 0 ? (
                <CategoryCards categories={latestCategories} />
              ) : (
                <p className="text-sm text-default-400">
                  No category data available yet.
                </p>
              )}
            </div>
          </div>

          <ScoreTrendChart audits={project.audits ?? []} />

          <AuditHistoryTable
            audits={project.audits ?? []}
            projectId={projectId}
          />
        </div>
      )}
    </AppShell>
  );
}
