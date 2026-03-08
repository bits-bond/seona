import type { Language, CategoryType } from '@/types';

export type PdfType = 'executive' | 'full';

export interface PdfScreenshot {
  filename: string;
  dataUri: string;
  page: string;
  device: 'desktop' | 'mobile';
  type: string;
}

export interface PdfCategoryData {
  category: CategoryType;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
}

export interface PdfIssueData {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string | null;
  recommendation: string | null;
  category: CategoryType | null;
}

export interface PdfAuditData {
  id: string;
  projectName: string;
  projectUrl: string;
  overallScore: number;
  businessType: string | null;
  pagesCrawled: number | null;
  completedAt: Date;
  fullReportMd: string | null;
  actionPlanMd: string | null;
  language: Language;
  categories: PdfCategoryData[];
  issues: PdfIssueData[];
  screenshots: PdfScreenshot[];
}
