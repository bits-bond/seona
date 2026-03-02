"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { AppShell } from '@/components/layout';
import { LoadingSkeleton, EmptyState, ScoreGauge, DataTable, ScoreBadge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  FolderOpen,
  ExternalLink,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import type { Project } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type SortField = 'name' | 'lastAuditScore' | 'lastAuditDate';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export default function ProjectsPage() {
  const { data: projects, isLoading, error, mutate } = useSWR<Project[]>('/api/projects', fetcher);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastAuditDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filteredAndSorted = useMemo(() => {
    if (!projects) return [];
    let result = [...projects];

    // Search filter
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.url.toLowerCase().includes(lower)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'lastAuditScore':
          cmp = (a.lastAuditScore ?? -1) - (b.lastAuditScore ?? -1);
          break;
        case 'lastAuditDate':
          cmp =
            new Date(a.lastAuditDate ?? 0).getTime() -
            new Date(b.lastAuditDate ?? 0).getTime();
          break;
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [projects, search, sortField, sortDirection]);

  const listColumns = [
    {
      key: 'name',
      label: 'Project',
      sortable: true,
      render: (row: Project) => (
        <Link
          href={`/projects/${row.id}`}
          className="font-medium text-foreground hover:text-primary transition-colors"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'url',
      label: 'URL',
      render: (row: Project) => (
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-default-500 hover:text-primary flex items-center gap-1"
        >
          {row.url.replace(/^https?:\/\//, '')}
          <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
    {
      key: 'lastAuditScore',
      label: 'Score',
      sortable: true,
      render: (row: Project) =>
        row.lastAuditScore !== null ? (
          <ScoreBadge score={row.lastAuditScore} />
        ) : (
          <span className="text-default-400">—</span>
        ),
    },
    {
      key: 'auditCount',
      label: 'Audits',
      sortable: true,
    },
    {
      key: 'lastAuditDate',
      label: 'Last Audit',
      sortable: true,
      render: (row: Project) => (
        <span className="text-sm">{formatDate(row.lastAuditDate)}</span>
      ),
    },
  ];

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Projects' },
      ]}
      pageTitle="Projects"
      pageDescription="Manage your SEO projects"
    >
      {isLoading ? (
        <div className="space-y-4">
          <LoadingSkeleton variant="card" count={4} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-danger text-sm">Failed to load projects.</p>
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-default-100 hover:bg-default-200 text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : !projects?.length ? (
        <EmptyState
          icon={<FolderOpen className="h-12 w-12" />}
          title="No projects yet"
          description="Create a new project and run your first SEO audit."
          actionLabel="New Audit"
          actionHref="/new-audit"
        />
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-default-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-divider bg-content1 text-sm text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center gap-1">
                <ArrowUpDown className="h-4 w-4 text-default-400" />
                <select
                  value={`${sortField}-${sortDirection}`}
                  onChange={(e) => {
                    const [field, dir] = e.target.value.split('-') as [SortField, SortDirection];
                    setSortField(field);
                    setSortDirection(dir);
                  }}
                  className="px-2 py-2 rounded-lg border border-divider bg-content1 text-sm text-foreground"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="lastAuditScore-desc">Highest Score</option>
                  <option value="lastAuditScore-asc">Lowest Score</option>
                  <option value="lastAuditDate-desc">Most Recent</option>
                  <option value="lastAuditDate-asc">Oldest</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-divider overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-content1 text-default-500 hover:bg-content2'} transition-colors`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-content1 text-default-500 hover:bg-content2'} transition-colors`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              <Link
                href="/new-audit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Link>
            </div>
          </div>

          {/* Content */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSorted.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-4 rounded-xl bg-content1 border border-divider hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                      <p className="text-xs text-default-500 truncate mt-0.5">
                        {project.url.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                    {project.lastAuditScore !== null && (
                      <ScoreGauge score={project.lastAuditScore} size="sm" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-default-400">
                    <span>{project.auditCount} audit{project.auditCount !== 1 ? 's' : ''}</span>
                    <span>{formatDate(project.lastAuditDate)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <DataTable
              data={filteredAndSorted}
              columns={listColumns}
              pageSize={10}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
