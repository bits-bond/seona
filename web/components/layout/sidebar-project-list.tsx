"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn, getScoreColor } from "@/lib/utils";
import type { Project } from "@/types";

const SCORE_DOT_COLORS: Record<string, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  accent: "bg-primary",
  success: "bg-success",
};

interface SidebarProjectListProps {
  collapsed?: boolean;
}

export function SidebarProjectList({ collapsed }: SidebarProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!cancelled) setProjects(data);
      } catch {
        // silently fail — sidebar shows empty list
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProjects();
    return () => { cancelled = true; };
  }, []);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 px-2 py-1">
        {projects.slice(0, 5).map((project) => {
          const color = project.lastAuditScore !== null
            ? SCORE_DOT_COLORS[getScoreColor(project.lastAuditScore)]
            : "bg-default-300";
          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              title={project.name}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-default-100 transition-colors"
            >
              <span className={cn("w-2.5 h-2.5 rounded-full", color)} />
            </Link>
          );
        })}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2 px-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-default-200" />
            <div className="h-3 rounded bg-default-200 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <p className="px-3 text-xs text-default-400">No projects yet</p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 px-2">
      {projects.map((project) => {
        const color = project.lastAuditScore !== null
          ? SCORE_DOT_COLORS[getScoreColor(project.lastAuditScore)]
          : "bg-default-300";
        return (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-default-600 hover:bg-default-100 hover:text-default-900 transition-colors"
          >
            <span className={cn("w-2 h-2 rounded-full shrink-0", color)} />
            <span className="truncate">{project.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
