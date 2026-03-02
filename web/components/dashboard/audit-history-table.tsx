"use client";

import Link from 'next/link';
import { DataTable, ScoreBadge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Audit } from '@/types';

interface AuditHistoryTableProps {
  audits: Audit[];
  projectId: string;
}

interface AuditRow {
  id: string;
  projectId: string;
  score: number | null;
  status: string;
  businessType: string | null;
  pagesCrawled: number | null;
  date: string;
}

export function AuditHistoryTable({ audits, projectId }: AuditHistoryTableProps) {
  const rows: AuditRow[] = audits
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((audit) => ({
      id: audit.id,
      projectId: audit.projectId,
      score: audit.overallScore,
      status: audit.status,
      businessType: audit.businessType,
      pagesCrawled: audit.pagesCrawled,
      date: formatDate(audit.completedAt ?? audit.createdAt),
    }));

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
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
        <span
          className={`capitalize text-sm font-medium ${
            row.status === 'completed'
              ? 'text-success'
              : row.status === 'failed'
                ? 'text-danger'
                : row.status === 'running'
                  ? 'text-warning'
                  : 'text-default-500'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'businessType',
      label: 'Business Type',
      render: (row: AuditRow) => (
        <span className="text-sm">{row.businessType ?? '—'}</span>
      ),
    },
    {
      key: 'pagesCrawled',
      label: 'Pages',
      render: (row: AuditRow) => (
        <span className="text-sm">{row.pagesCrawled ?? '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row: AuditRow) => (
        <Link
          href={`/projects/${projectId}/audits/${row.id}`}
          className="text-sm text-primary hover:underline"
        >
          View Details
        </Link>
      ),
    },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Audit History</h3>
      <DataTable
        data={rows}
        columns={columns}
        pageSize={10}
        emptyMessage="No audits yet. Run your first audit to see results here."
      />
    </div>
  );
}
