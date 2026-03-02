"use client";

import { useState } from 'react';
import { MarkdownRenderer } from '@/components/ui';
import { cn } from '@/lib/utils';
import { FileText, ListChecks } from 'lucide-react';

interface ReportViewerProps {
  fullReportMd: string | null;
  actionPlanMd: string | null;
  className?: string;
}

type TabKey = 'report' | 'action-plan';

export function ReportViewer({ fullReportMd, actionPlanMd, className }: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('report');

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'report', label: 'Full Report', icon: <FileText className="h-4 w-4" /> },
    { key: 'action-plan', label: 'Action Plan', icon: <ListChecks className="h-4 w-4" /> },
  ];

  const content = activeTab === 'report' ? fullReportMd : actionPlanMd;

  return (
    <div className={cn('', className)}>
      <h3 className="text-lg font-semibold mb-4">Reports</h3>

      {/* Tab bar */}
      <div className="flex border-b border-divider mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-default-500 hover:text-foreground hover:border-default-300'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 rounded-xl bg-content1 border border-divider overflow-auto max-h-[800px]">
        {content ? (
          <MarkdownRenderer content={content} />
        ) : (
          <p className="text-sm text-default-400 text-center py-8">
            No {activeTab === 'report' ? 'report' : 'action plan'} available for this audit.
          </p>
        )}
      </div>
    </div>
  );
}
