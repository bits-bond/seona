export type CategoryType =
  | 'technical'
  | 'content'
  | 'on_page'
  | 'schema'
  | 'performance'
  | 'images'
  | 'ai_readiness';

export interface AuditProgress {
  percentage: number;
  stage: string;
  message: string;
  timestamp: Date;
}

export interface ParsedReport {
  overallScore: number;
  businessType: string | null;
  pagesCrawled: number | null;
  categories: {
    category: CategoryType;
    score: number;
    weight: number;
    weightedScore: number;
  }[];
  fullReportMd: string;
}

export interface ParsedActionPlan {
  issues: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string | null;
    orderIndex: number;
    category: CategoryType | null;
  }[];
  actionPlanMd: string;
}
