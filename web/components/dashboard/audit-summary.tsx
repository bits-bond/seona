"use client";

import { ScoreGauge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Globe, Building2, FileStack, Calendar } from 'lucide-react';
import type { Audit } from '@/types';

interface AuditSummaryProps {
  audit: Audit;
}

export function AuditSummary({ audit }: AuditSummaryProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 p-6 rounded-xl bg-content1 border border-divider">
      <div className="flex-shrink-0">
        <ScoreGauge
          score={audit.overallScore ?? 0}
          size="lg"
          showLabel
          animated
        />
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-default-100">
            <Building2 className="h-5 w-5 text-default-600" />
          </div>
          <div>
            <p className="text-xs text-default-500">Business Type</p>
            <p className="text-sm font-medium">{audit.businessType ?? '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-default-100">
            <FileStack className="h-5 w-5 text-default-600" />
          </div>
          <div>
            <p className="text-xs text-default-500">Pages Crawled</p>
            <p className="text-sm font-medium">{audit.pagesCrawled ?? '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-default-100">
            <Calendar className="h-5 w-5 text-default-600" />
          </div>
          <div>
            <p className="text-xs text-default-500">Completed</p>
            <p className="text-sm font-medium">{formatDate(audit.completedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-default-100">
            <Globe className="h-5 w-5 text-default-600" />
          </div>
          <div>
            <p className="text-xs text-default-500">Status</p>
            <p
              className={`text-sm font-medium capitalize ${
                audit.status === 'completed'
                  ? 'text-success'
                  : audit.status === 'failed'
                    ? 'text-danger'
                    : audit.status === 'running'
                      ? 'text-warning'
                      : 'text-default-500'
              }`}
            >
              {audit.status}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
