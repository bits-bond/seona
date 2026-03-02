"use client";

import useSWR from 'swr';
import { AppShell } from '@/components/layout';
import { LoadingSkeleton, EmptyState } from '@/components/ui';
import {
  OverviewCards,
  RecentAuditsTable,
  ScoreDistribution,
  CategoryAverages,
} from '@/components/dashboard';
import { BarChart3, RefreshCw } from 'lucide-react';
import type { Project, Audit, AuditCategory } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { data: projects, isLoading: projectsLoading, error: projectsError, mutate: mutateProjects } = useSWR<Project[]>('/api/projects', fetcher);
  const { data: audits, isLoading: auditsLoading, error: auditsError, mutate: mutateAudits } = useSWR<Audit[]>('/api/audits', fetcher);
  const { data: categories, isLoading: categoriesLoading } = useSWR<AuditCategory[]>('/api/audits/categories', fetcher);

  const isLoading = projectsLoading || auditsLoading || categoriesLoading;
  const error = projectsError || auditsError;

  const handleRetry = () => {
    mutateProjects();
    mutateAudits();
  };

  return (
    <AppShell
      breadcrumbs={[{ label: 'Dashboard' }]}
      pageTitle="SEO Dashboard"
      pageDescription="Overview of all your SEO projects and audits"
    >
      {isLoading ? (
        <div className="space-y-6">
          <LoadingSkeleton variant="card" count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSkeleton variant="chart" />
            <LoadingSkeleton variant="chart" />
          </div>
          <LoadingSkeleton variant="table" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-danger text-sm">Failed to load dashboard data.</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-default-100 hover:bg-default-200 text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : !projects?.length ? (
        <EmptyState
          icon={<BarChart3 className="h-12 w-12" />}
          title="No projects yet"
          description="Create your first project and run an SEO audit to see your dashboard come to life."
          actionLabel="New Audit"
          actionHref="/new-audit"
        />
      ) : (
        <div className="space-y-6">
          <OverviewCards projects={projects} audits={audits ?? []} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScoreDistribution projects={projects} />
            <CategoryAverages categories={categories ?? []} />
          </div>
          <RecentAuditsTable audits={audits ?? []} projects={projects} />
        </div>
      )}
    </AppShell>
  );
}
