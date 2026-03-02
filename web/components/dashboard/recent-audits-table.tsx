"use client";

import Link from 'next/link';
import { DataTable } from '@/components/ui';
import { SeverityBadge, ScoreBadge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import type { Audit, Project } from '@/types';

interface RecentAuditsTableProps {
  audits: Audit[];
  projects: Project[];
}

interface AuditRow {
  id: string;
  projectId: string;
  projectName: string;
  url: string;
  score: number | null;
  status: string;
  date: string;
}

export function RecentAuditsTable({ audits, projects }: RecentAuditsTableProps) {
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const recentAudits: AuditRow[] = audits
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((audit) => {
      const project = projectMap.get(audit.projectId);
      return {
        id: audit.id,
        projectId: audit.projectId,
        projectName: project?.name ?? 'Unknown',
        url: project?.url ?? '',
        score: audit.overallScore,
        status: audit.status,
        date: formatDate(audit.createdAt),
      };
    });

  const columns = [
    {
      key: 'projectName',
      label: 'Project',
      sortable: true,
      render: (row: AuditRow) => (
        <Link
          href={`/projects/${row.projectId}`}
          className="font-medium text-foreground hover:text-primary transition-colors"
        >
          {row.projectName}
        </Link>
      ),
    },
    {
      key: 'url',
      label: 'URL',
      render: (row: AuditRow) => (
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
      key: 'score',
      label: 'Score',
      sortable: true,
      render: (row: AuditRow) =>
        row.score !== null ? <ScoreBadge score={row.score} /> : <span className="text-default-400">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: AuditRow) => (
        <span className="capitalize text-sm">{row.status}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
    },
    {
      key: 'actions',
      label: '',
      render: (row: AuditRow) => (
        <Link
          href={`/projects/${row.projectId}/audits/${row.id}`}
          className="text-sm text-primary hover:underline"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Recent Audits</h3>
      <DataTable
        data={recentAudits}
        columns={columns}
        pageSize={5}
        emptyMessage="No audits yet. Run your first audit to get started."
      />
    </div>
  );
}
