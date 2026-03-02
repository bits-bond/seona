"use client";

import { StatCard } from '@/components/ui';
import { formatScore, formatDate } from '@/lib/utils';
import { FolderOpen, TrendingUp, ClipboardList, Clock } from 'lucide-react';
import type { Project, Audit } from '@/types';

interface OverviewCardsProps {
  projects: Project[];
  audits: Audit[];
}

export function OverviewCards({ projects, audits }: OverviewCardsProps) {
  const totalProjects = projects.length;

  const avgScore =
    projects.length > 0
      ? Math.round(
          projects.reduce((sum, p) => sum + (p.lastAuditScore ?? 0), 0) /
            projects.filter((p) => p.lastAuditScore !== null).length || 0
        )
      : 0;

  const totalAudits = audits.length;

  const latestAuditDate =
    audits.length > 0
      ? audits.reduce((latest, a) => {
          const date = new Date(a.createdAt);
          return date > latest ? date : latest;
        }, new Date(0))
      : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Projects"
        value={totalProjects.toString()}
        icon={<FolderOpen className="h-5 w-5" />}
      />
      <StatCard
        label="Average Score"
        value={formatScore(avgScore)}
        icon={<TrendingUp className="h-5 w-5" />}
      />
      <StatCard
        label="Total Audits"
        value={totalAudits.toString()}
        icon={<ClipboardList className="h-5 w-5" />}
      />
      <StatCard
        label="Latest Audit"
        value={formatDate(latestAuditDate)}
        icon={<Clock className="h-5 w-5" />}
      />
    </div>
  );
}
