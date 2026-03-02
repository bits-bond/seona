"use client";

import Link from 'next/link';
import { ScoreGauge } from '@/components/ui';
import { ExternalLink, Play } from 'lucide-react';
import type { Project } from '@/types';

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-xl bg-content1 border border-divider">
      <div className="flex items-center gap-6">
        {project.lastAuditScore !== null && (
          <ScoreGauge score={project.lastAuditScore} size="md" showLabel />
        )}
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-default-500 hover:text-primary flex items-center gap-1 mt-1"
          >
            {project.url}
            <ExternalLink className="h-3 w-3" />
          </a>
          <p className="text-xs text-default-400 mt-1">
            {project.auditCount} audit{project.auditCount !== 1 ? 's' : ''} run
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          href={`/new-audit?projectId=${project.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Play className="h-4 w-4" />
          Run New Audit
        </Link>
      </div>
    </div>
  );
}
