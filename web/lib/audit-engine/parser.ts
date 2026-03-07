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
  const overallScoreMatch = markdown.match(/(?:#{2,3}\s*(?:Overall\s+)?SEO Health Score:\s*|(?:Overall\s+)?SEO Health Score\*{0,2}\s*\|\s*\*{0,2})(\d+)\s*\/\s*100/);
  const overallScore = overallScoreMatch ? parseInt(overallScoreMatch[1], 10) : 0;

  const businessTypeMatch = markdown.match(/\*\*Business(?:\s+Type)?(?:\s+Detected)?:\*\*\s*(.+)/);
  const businessType = businessTypeMatch ? businessTypeMatch[1].trim().replace(/\s*—.*$/, '') : null;

  const pagesCrawledMatch = markdown.match(/\*\*Pages (?:Crawled|Discovered):\*\*\s*(\d+)/);
  const pagesCrawled = pagesCrawledMatch ? parseInt(pagesCrawledMatch[1], 10) : null;

  const categories: ParsedReport['categories'] = [];

  // Parse category rows from markdown tables in any column order
  // Match rows containing a category name, a percentage, a score/100, and a weighted value
  const tableRowRegex = /^\|(.+)\|$/gm;
  let rowMatch;

  while ((rowMatch = tableRowRegex.exec(markdown)) !== null) {
    const cells = rowMatch[1].split('|').map(c => c.trim());

    // Find the category name cell
    let catName: string | null = null;
    let catType: CategoryType | undefined;
    let weight: number | null = null;
    let score: number | null = null;
    let weightedScore: number | null = null;

    for (const cell of cells) {
      // Check if this cell is a category name
      const cleanCell = cell.replace(/^\|?\s*/, '').trim();
      if (CATEGORY_MAP[cleanCell]) {
        catName = cleanCell;
        catType = CATEGORY_MAP[cleanCell];
        continue;
      }
      // Check for weight (N%)
      const weightMatch = cell.match(/^(\d+)%$/);
      if (weightMatch) {
        weight = parseInt(weightMatch[1], 10);
        continue;
      }
      // Check for score (N/100)
      const scoreMatch = cell.match(/^(\d+)\s*\/\s*100$/);
      if (scoreMatch) {
        score = parseInt(scoreMatch[1], 10);
        continue;
      }
      // Check for weighted score as fraction (N / M where M is weight like 25, 20, 10, 5)
      const fractionMatch = cell.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (fractionMatch && catName && [25, 20, 10, 5].includes(parseInt(fractionMatch[2]))) {
        const ws = parseInt(fractionMatch[1], 10);
        const w = parseInt(fractionMatch[2], 10);
        weight = w;
        weightedScore = ws;
        score = w > 0 ? Math.round((ws / w) * 100) : 0;
        continue;
      }
      // Check for weighted score (decimal number like 7.00 or 10.5)
      const weightedMatch = cell.match(/^(\d+\.?\d*)$/);
      if (weightedMatch && catName) {
        weightedScore = parseFloat(weightedMatch[1]);
      }
    }

    if (catType && weight !== null && score !== null) {
      categories.push({
        category: catType,
        weight,
        score,
        weightedScore: weightedScore ?? (weight * score) / 100,
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
    // Detect severity headers: ## CRITICAL, ## Critical Priority, etc.
    const severityMatch = line.match(/^## (CRITICAL|HIGH|MEDIUM|LOW)\b/i);
    if (severityMatch) {
      flushIssue();
      const key = severityMatch[1].toUpperCase();
      currentSeverity = SEVERITY_HEADERS[key];
      continue;
    }

    // Detect issue title: ### N. Title  or  ### C1. Title  or  ### H2. Title
    const titleMatch = line.match(/^### (?:[A-Z]?\d+)\.\s+(.+)/);
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
