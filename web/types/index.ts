export type Language = 'en' | 'de';

export interface Project {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  lastAuditScore: number | null;
  lastAuditDate: Date | null;
  auditCount: number;
}

export interface Audit {
  id: string;
  projectId: string;
  status: "pending" | "running" | "completed" | "failed";
  overallScore: number | null;
  businessType: string | null;
  pagesCrawled: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  fullReportMd: string | null;
  actionPlanMd: string | null;
  language: Language;
  createdAt: Date;
}

export interface AuditCategory {
  id: string;
  auditId: string;
  category: CategoryType;
  score: number;
  weight: number;
  weightedScore: number;
  findingsJson: Record<string, unknown> | null;
}

export type CategoryType =
  | "technical"
  | "content"
  | "on_page"
  | "schema"
  | "performance"
  | "images"
  | "ai_readiness";

export interface AuditIssue {
  id: string;
  auditId: string;
  category: CategoryType;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string | null;
  recommendation: string | null;
  orderIndex: number;
}

export interface AuditSubReport {
  id: string;
  auditId: string;
  slug: string;
  title: string;
  content: string;
  source: string;
  createdAt: Date;
}

export const CATEGORY_CONFIG: Record<
  CategoryType,
  { label: string; weight: number; color: string; icon: string }
> = {
  technical: {
    label: "Technical SEO",
    weight: 25,
    color: "var(--chart-1)",
    icon: "Settings",
  },
  content: {
    label: "Content Quality",
    weight: 25,
    color: "var(--chart-2)",
    icon: "FileText",
  },
  on_page: {
    label: "On-Page SEO",
    weight: 20,
    color: "var(--chart-3)",
    icon: "Code",
  },
  schema: {
    label: "Schema / Structured Data",
    weight: 10,
    color: "var(--chart-4)",
    icon: "Database",
  },
  performance: {
    label: "Performance (CWV)",
    weight: 10,
    color: "var(--chart-5)",
    icon: "Zap",
  },
  images: {
    label: "Images",
    weight: 5,
    color: "var(--chart-1)",
    icon: "Image",
  },
  ai_readiness: {
    label: "AI Search Readiness",
    weight: 5,
    color: "var(--chart-2)",
    icon: "Bot",
  },
};

export const SEVERITY_CONFIG = {
  critical: { label: "Critical", color: "danger" as const, priority: 0 },
  high: { label: "High", color: "warning" as const, priority: 1 },
  medium: { label: "Medium", color: "accent" as const, priority: 2 },
  low: { label: "Low", color: "default" as const, priority: 3 },
};
