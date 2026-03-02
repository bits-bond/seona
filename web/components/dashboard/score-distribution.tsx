"use client";

import { ChartBar } from '@/components/ui';
import type { Project } from '@/types';

interface ScoreDistributionProps {
  projects: Project[];
}

export function ScoreDistribution({ projects }: ScoreDistributionProps) {
  const ranges = [
    { name: '0-19', min: 0, max: 19 },
    { name: '20-39', min: 20, max: 39 },
    { name: '40-59', min: 40, max: 59 },
    { name: '60-79', min: 60, max: 79 },
    { name: '80-100', min: 80, max: 100 },
  ];

  const data = ranges.map((range) => ({
    name: range.name,
    count: projects.filter(
      (p) =>
        p.lastAuditScore !== null &&
        p.lastAuditScore >= range.min &&
        p.lastAuditScore <= range.max
    ).length,
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
      <ChartBar
        data={data}
        xKey="name"
        yKeys={["count"]}
        height={300}
      />
    </div>
  );
}
