import type { CategoryType, ParsedReport, ParsedActionPlan } from './types';

const CATEGORY_MAP: Record<string, CategoryType> = {
  'Technical SEO': 'technical',
  'Content Quality': 'content',
  'On-Page SEO': 'on_page',
  'Schema / Structured Data': 'schema',
  'Performance (CWV)': 'performance',
  'Images': 'images',
  'AI Search Readiness': 'ai_readiness',
};

const SEVERITY_HEADERS: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
  'CRITICAL': 'critical',
  'HIGH': 'high',
  'MEDIUM': 'medium',
  'LOW': 'low',
};

/**
 * Parse the FULL-AUDIT-REPORT.md into structured data.
 */
export function parseFullReport(markdown: string): ParsedReport {
  const overallScoreMatch = markdown.match(/## SEO Health Score:\s*(\d+)\/100/);
  const overallScore = overallScoreMatch ? parseInt(overallScoreMatch[1], 10) : 0;

  const businessTypeMatch = markdown.match(/\*\*Business Type:\*\*\s*(.+)/);
  const businessType = businessTypeMatch ? businessTypeMatch[1].trim() : null;

  const pagesCrawledMatch = markdown.match(/\*\*Pages Crawled:\*\*\s*(\d+)/);
  const pagesCrawled = pagesCrawledMatch ? parseInt(pagesCrawledMatch[1], 10) : null;

  const categories: ParsedReport['categories'] = [];
  const categoryRegex = /\|\s*(.+?)\s*\|\s*(\d+)%\s*\|\s*(\d+)\/100\s*\|\s*([\d.]+)\s*\|/g;
  let match;

  while ((match = categoryRegex.exec(markdown)) !== null) {
    const rawName = match[1].trim();
    const category = CATEGORY_MAP[rawName];
    if (category) {
      categories.push({
        category,
        weight: parseInt(match[2], 10),
        score: parseInt(match[3], 10),
        weightedScore: parseFloat(match[4]),
      });
    }
  }

  return {
    overallScore,
    businessType,
    pagesCrawled,
    categories,
    fullReportMd: markdown,
  };
}

/**
 * Parse the ACTION-PLAN.md into structured issues.
 */
export function parseActionPlan(markdown: string): ParsedActionPlan {
  const issues: ParsedActionPlan['issues'] = [];
  const lines = markdown.split('\n');

  let currentSeverity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
  let currentTitle: string | null = null;
  let currentDescription: string[] = [];
  let currentImpact: string | null = null;
  let orderIndex = 0;

  const flushIssue = () => {
    if (currentTitle) {
      issues.push({
        severity: currentSeverity,
        title: currentTitle,
        description: currentDescription.join('\n').trim(),
        impact: currentImpact,
        orderIndex,
        category: guessCategory(currentTitle, currentDescription.join('\n')),
      });
      orderIndex++;
    }
    currentTitle = null;
    currentDescription = [];
    currentImpact = null;
  };

  for (const line of lines) {
    // Detect severity headers: ## CRITICAL, ## HIGH, ## MEDIUM, ## LOW
    const severityMatch = line.match(/^## (CRITICAL|HIGH|MEDIUM|LOW)\b/);
    if (severityMatch) {
      flushIssue();
      currentSeverity = SEVERITY_HEADERS[severityMatch[1]];
      continue;
    }

    // Detect issue title: ### N. Title
    const titleMatch = line.match(/^### \d+\.\s+(.+)/);
    if (titleMatch) {
      flushIssue();
      currentTitle = titleMatch[1].trim();
      continue;
    }

    // Detect impact line
    const impactMatch = line.match(/^\*\*Impact:\*\*\s*(.+)/);
    if (impactMatch) {
      currentImpact = impactMatch[1].trim();
      continue;
    }

    // Accumulate description lines (skip empty lines at the start)
    if (currentTitle) {
      currentDescription.push(line);
    }
  }

  // Flush the last issue
  flushIssue();

  return {
    issues,
    actionPlanMd: markdown,
  };
}

/**
 * Best-effort category guess from issue title and description.
 */
function guessCategory(title: string, description: string): CategoryType | null {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes('robots.txt') || text.includes('sitemap') || text.includes('crawl') ||
      text.includes('canonical') || text.includes('redirect') || text.includes('ssl') ||
      text.includes('https') || text.includes('security header') || text.includes('hsts') ||
      text.includes('indexab') || text.includes('404') || text.includes('301')) {
    return 'technical';
  }
  if (text.includes('schema') || text.includes('json-ld') || text.includes('structured data') ||
      text.includes('organization') || text.includes('breadcrumb')) {
    return 'schema';
  }
  if (text.includes('core web vital') || text.includes('cwv') || text.includes('lcp') ||
      text.includes('inp') || text.includes('cls') || text.includes('ttfb') ||
      text.includes('page speed') || text.includes('performance')) {
    return 'performance';
  }
  if (text.includes('image') || text.includes('alt text') || text.includes('webp') ||
      text.includes('avif') || text.includes('lazy load')) {
    return 'images';
  }
  if (text.includes('e-e-a-t') || text.includes('eeat') || text.includes('content') ||
      text.includes('thin page') || text.includes('readability') || text.includes('word count')) {
    return 'content';
  }
  if (text.includes('title tag') || text.includes('meta description') || text.includes('heading') ||
      text.includes('h1') || text.includes('internal link') || text.includes('anchor text') ||
      text.includes('on-page') || text.includes('keyword')) {
    return 'on_page';
  }
  if (text.includes('ai search') || text.includes('llms.txt') || text.includes('gptbot') ||
      text.includes('ai overview') || text.includes('geo ') || text.includes('ai readiness')) {
    return 'ai_readiness';
  }

  return null;
}
