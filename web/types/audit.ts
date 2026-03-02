import type { CategoryType } from "./index";

export interface CategoryDefinition {
  type: CategoryType;
  label: string;
  weight: number;
  description: string;
}

export const AUDIT_CATEGORIES: CategoryDefinition[] = [
  {
    type: "technical",
    label: "Technical SEO",
    weight: 25,
    description:
      "Crawlability, indexability, robots.txt, sitemap, canonical tags, security headers, and URL structure",
  },
  {
    type: "content",
    label: "Content Quality",
    weight: 25,
    description:
      "E-E-A-T signals, readability, content depth, thin content detection, and keyword optimization",
  },
  {
    type: "on_page",
    label: "On-Page SEO",
    weight: 20,
    description:
      "Title tags, meta descriptions, heading hierarchy, internal linking, and anchor text optimization",
  },
  {
    type: "schema",
    label: "Schema / Structured Data",
    weight: 10,
    description:
      "JSON-LD markup detection, validation, coverage, and rich result eligibility",
  },
  {
    type: "performance",
    label: "Performance (CWV)",
    weight: 10,
    description:
      "Core Web Vitals including LCP, INP, CLS, page load speed, and resource optimization",
  },
  {
    type: "images",
    label: "Images",
    weight: 5,
    description:
      "Alt text coverage, file sizes, modern formats, lazy loading, and responsive images",
  },
  {
    type: "ai_readiness",
    label: "AI Search Readiness",
    weight: 5,
    description:
      "AI crawler accessibility, llms.txt compliance, passage-level citability, and brand mention signals",
  },
];

export interface AuditRunConfig {
  projectId: string;
  url: string;
  maxPages?: number;
}

export interface AuditProgress {
  status: "pending" | "running" | "completed" | "failed";
  currentStep?: string;
  progress?: number;
  error?: string;
}

export interface AuditSummary {
  overallScore: number;
  businessType: string;
  pagesCrawled: number;
  categories: {
    type: CategoryType;
    score: number;
    weight: number;
    weightedScore: number;
    issueCount: number;
  }[];
  issueCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}
