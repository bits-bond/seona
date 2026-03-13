import type { Language, CategoryType } from '@/types';

export type PdfType = 'executive' | 'full';
export type PdfTheme = 'light' | 'dark';

export interface PdfColorPalette {
  bg: string;
  bgAlt: string;
  bgGradient1: string;
  bgGradient2: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textDimmed: string;
  border: string;
  accent: string;
  link: string;
  tableHeaderBg: string;
  tableRowAltBg: string;
  cardBg: string;
  recommendationBg: string;
  recommendationAccent: string;
  impactColor: string;
  codeBg: string;
}

export const DARK_PALETTE: PdfColorPalette = {
  bg: '#0a0a0f',
  bgAlt: '#12121a',
  bgGradient1: '#0a0a0f',
  bgGradient2: '#1a1a2e',
  text: '#e8e8ed',
  textSecondary: '#c8c8d0',
  textMuted: '#8888a0',
  textDimmed: '#6868a0',
  border: '#2a2a3e',
  accent: '#e05a33',
  link: '#4da6ff',
  tableHeaderBg: '#1a1a2e',
  tableRowAltBg: 'rgba(26, 26, 46, 0.5)',
  cardBg: '#12121a',
  recommendationBg: 'rgba(42, 157, 143, 0.08)',
  recommendationAccent: '#2a9d8f',
  impactColor: '#e9c46a',
  codeBg: '#1a1a2e',
};

export const LIGHT_PALETTE: PdfColorPalette = {
  bg: '#ffffff',
  bgAlt: '#f8f9fa',
  bgGradient1: '#f0f2f5',
  bgGradient2: '#e2e6ec',
  text: '#1a1a2e',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textDimmed: '#9ca3af',
  border: '#e5e7eb',
  accent: '#e05a33',
  link: '#2563eb',
  tableHeaderBg: '#f3f4f6',
  tableRowAltBg: 'rgba(243, 244, 246, 0.5)',
  cardBg: '#f8f9fa',
  recommendationBg: 'rgba(42, 157, 143, 0.06)',
  recommendationAccent: '#0d9488',
  impactColor: '#b45309',
  codeBg: '#f3f4f6',
};

export function getPalette(theme: PdfTheme): PdfColorPalette {
  return theme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
}

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
