"use client";

import { useState, useMemo } from 'react';
import { DataTable, SeverityBadge } from '@/components/ui';
import { CATEGORY_CONFIG, SEVERITY_CONFIG } from '@/types';
import { cn } from '@/lib/utils';
import type { AuditIssue, CategoryType } from '@/types';

interface IssuesTableProps {
  issues: AuditIssue[];
  className?: string;
}

type SeverityType = keyof typeof SEVERITY_CONFIG;

export function IssuesTable({ issues, className }: IssuesTableProps) {
  const [activeSeverities, setActiveSeverities] = useState<Set<SeverityType>>(
    new Set(['critical', 'high', 'medium', 'low'])
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleSeverity = (severity: SeverityType) => {
    setActiveSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) {
        if (next.size > 1) next.delete(severity);
      } else {
        next.add(severity);
      }
      return next;
    });
  };

  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => activeSeverities.has(issue.severity as SeverityType))
      .filter((issue) => selectedCategory === 'all' || issue.category === selectedCategory)
      .sort((a, b) => {
        const aPriority = SEVERITY_CONFIG[a.severity as SeverityType]?.priority ?? 99;
        const bPriority = SEVERITY_CONFIG[b.severity as SeverityType]?.priority ?? 99;
        return aPriority - bPriority;
      });
  }, [issues, activeSeverities, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(issues.map((i) => i.category));
    return Array.from(cats) as CategoryType[];
  }, [issues]);

  const severities: SeverityType[] = ['critical', 'high', 'medium', 'low'];

  const columns = [
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (row: AuditIssue) => <SeverityBadge severity={row.severity} />,
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (row: AuditIssue) => (
        <span className="text-sm">
          {CATEGORY_CONFIG[row.category as CategoryType]?.label ?? row.category}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Issue',
      sortable: true,
      render: (row: AuditIssue) => (
        <div>
          <p className="text-sm font-medium">{row.title}</p>
          {row.description && (
            <p className="text-xs text-default-500 mt-0.5 line-clamp-2">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'impact',
      label: 'Impact',
      render: (row: AuditIssue) => (
        <span className="text-sm text-default-500">{row.impact ?? '—'}</span>
      ),
    },
    {
      key: 'recommendation',
      label: 'Recommendation',
      render: (row: AuditIssue) => (
        <span className="text-sm text-default-500 line-clamp-2">{row.recommendation ?? '—'}</span>
      ),
    },
  ];

  return (
    <div className={cn('', className)}>
      <h3 className="text-lg font-semibold mb-4">Issues</h3>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Severity chip toggles */}
        <div className="flex flex-wrap gap-2">
          {severities.map((severity) => {
            const config = SEVERITY_CONFIG[severity];
            const isActive = activeSeverities.has(severity);
            const count = issues.filter((i) => i.severity === severity).length;

            return (
              <button
                key={severity}
                onClick={() => toggleSeverity(severity)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                  isActive
                    ? 'bg-content1 border-divider shadow-sm'
                    : 'bg-transparent border-transparent text-default-400 hover:text-default-600'
                )}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isActive ? 'opacity-100' : 'opacity-40'
                  )}
                  style={{
                    backgroundColor:
                      severity === 'critical'
                        ? 'var(--chart-critical)'
                        : severity === 'high'
                          ? 'var(--chart-high)'
                          : severity === 'medium'
                            ? 'var(--chart-medium)'
                            : 'var(--chart-low)',
                  }}
                />
                {config.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Category dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-divider bg-content1 text-sm text-foreground"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_CONFIG[cat]?.label ?? cat}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        data={filteredIssues}
        columns={columns}
        pageSize={10}
        emptyMessage="No issues found matching the selected filters."
      />
    </div>
  );
}
