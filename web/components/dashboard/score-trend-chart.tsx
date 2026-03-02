"use client";

import { ChartArea } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Audit } from '@/types';

interface ScoreTrendChartProps {
  audits: Audit[];
}

export function ScoreTrendChart({ audits }: ScoreTrendChartProps) {
  const data = audits
    .filter((a) => a.overallScore !== null && a.status === 'completed')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((audit) => ({
      date: formatDate(audit.completedAt ?? audit.createdAt),
      score: audit.overallScore ?? 0,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-default-400 text-sm">
        No completed audits to show trend data.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Score Trend</h3>
      <ChartArea
        data={data}
        dataKey="score"
        xAxisKey="date"
        height={300}
        color="var(--chart-2)"
        yDomain={[0, 100]}
      />
    </div>
  );
}
