import type { CategoryType, ParsedReport, ParsedActionPlan } from './types';

// ── Fast-path exact category name map ───────────────────────────────────────
const CATEGORY_MAP: Record<string, CategoryType> = {
  'Technical SEO': 'technical',
  'Content Quality': 'content',
  'On-Page SEO': 'on_page',
  'Schema / Structured Data': 'schema',
  'Performance (CWV)': 'performance',
  'Images': 'images',
  'AI Search Readiness': 'ai_readiness',
  // German category names (observed variants)
  'Technische SEO': 'technical',
  'Technisches SEO': 'technical',
  'Inhaltsqualität': 'content',
  'Inhaltsqualitaet': 'content',
  'Content-Qualitaet': 'content',
  'Content-Qualität': 'content',
  'On-Page-SEO': 'on_page',
  'Schema / Strukturierte Daten': 'schema',
  'Leistung (CWV)': 'performance',
  'Performance (Core Web Vitals)': 'performance',
  'Bilder': 'images',
  'Bildoptimierung': 'images',
  'KI-Suchbereitschaft': 'ai_readiness',
};

const SEVERITY_HEADERS: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
  'CRITICAL': 'critical',
  'HIGH': 'high',
  'MEDIUM': 'medium',
  'LOW': 'low',
  // German severity headers
  'KRITISCH': 'critical',
  'HOCH': 'high',
  'MITTEL': 'medium',
  'NIEDRIG': 'low',
};

// ── Fuzzy category matching ─────────────────────────────────────────────────

/**
 * Match a raw category name to a canonical CategoryType.
 * Tier 1: exact map lookup. Tier 2: keyword-based fuzzy match.
 */
function matchCategory(rawName: string): CategoryType | undefined {
  // Tier 1: exact match
  if (CATEGORY_MAP[rawName]) return CATEGORY_MAP[rawName];

  // Tier 2: normalize and match on keywords
  const n = rawName
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip combining accents
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u')
    .trim();

  // Order: specific patterns before generic ones
  if (/on[- ]?page/i.test(n)) return 'on_page';
  if (/schema|struktur|structured/i.test(n)) return 'schema';
  if (/performance|cwv|core web|leistung/i.test(n)) return 'performance';
  if (/(?:ai|ki)[- ]?(?:search|such|readiness|bereitschaft)/i.test(n)) return 'ai_readiness';
  if (/bild|image/i.test(n)) return 'images';
  if (/content|inhalt|qualit/i.test(n)) return 'content';
  if (/techni/i.test(n)) return 'technical';

  return undefined;
}

// ── Tiered score extraction ─────────────────────────────────────────────────

/**
 * Extract the overall SEO health score from the report markdown.
 * Uses a tiered approach: canonical → broad regex → heading-based → table row → weighted sum fallback.
 */
function extractOverallScore(markdown: string): number {
  // Tier 1: canonical format — ### Overall SEO Health Score: N/100
  const t1 = markdown.match(/###\s*Overall SEO Health Score:\s*(\d+)\s*\/\s*100/);
  if (t1) return parseInt(t1[1], 10);

  // Tier 2: broad match for known label variants
  const t2 = markdown.match(
    /#{2,3}\s*(?:(?:Overall\s+)?SEO[\s-]*Health[\s-]*Score|SEO[\s-]*Gesundheit\w*|Gesamtbewertung|Health\s*Score)\s*:?\s*\*{0,2}\s*(\d+)\s*\/\s*100/i
  );
  if (t2) return parseInt(t2[1], 10);

  // Tier 3: any heading with score/bewertung/health/gesundheit keywords — score on same line or next line
  const firstLines = markdown.split('\n').slice(0, 60);
  for (let i = 0; i < firstLines.length; i++) {
    const line = firstLines[i];
    if (/^#{2,3}\s/.test(line) && /(?:score|bewertung|gesundheit|health|gesamt)/i.test(line)) {
      // Check same line
      const sameLine = line.match(/(\d+)\s*\/\s*100/);
      if (sameLine) return parseInt(sameLine[1], 10);
      // Check next line
      if (i + 1 < firstLines.length) {
        const nextLine = firstLines[i + 1].match(/(\d+)\s*\/\s*100/);
        if (nextLine) return parseInt(nextLine[1], 10);
      }
    }
  }

  // Tier 4: "Overall" or "Gesamt" row in a table
  const t4 = markdown.match(
    /\|\s*\*{0,2}(?:Overall|Total|Gesamt)\*{0,2}\s*\|[^|]*\|[^|]*?\*{0,2}(\d+)\s*\/\s*100/i
  );
  if (t4) return parseInt(t4[1], 10);

  return 0;
}

// ── Severity detection ──────────────────────────────────────────────────────

type Severity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Detect severity from an H2 heading line. Returns null if not a severity header.
 */
function detectSeverityHeader(line: string): Severity | null {
  // Pattern 1: ## CRITICAL, ## HIGH, ## MEDIUM, ## LOW (English)
  const enMatch = line.match(/^##\s+(CRITICAL|HIGH|MEDIUM|LOW)\b/i);
  if (enMatch) return SEVERITY_HEADERS[enMatch[1].toUpperCase()] ?? null;

  // Pattern 2: ## KRITISCH, ## HOCH, ## MITTEL, ## NIEDRIG (German)
  const deMatch = line.match(/^##\s+(KRITISCH|HOCH|MITTEL|NIEDRIG)\b/i);
  if (deMatch) return SEVERITY_HEADERS[deMatch[1].toUpperCase()] ?? null;

  // Pattern 3: ## Kritisch -- Sofort... (German with dash/emdash suffix)
  const deDashMatch = line.match(/^##\s+(Kritisch|Hoch|Mittel|Niedrig)\s*[—–-]/i);
  if (deDashMatch) return SEVERITY_HEADERS[deDashMatch[1].toUpperCase()] ?? null;

  // Pattern 4: ## Critical Priority (...) / ## High Priority (...)
  const priorityMatch = line.match(/^##\s+(Critical|High|Medium|Low)\s+Priority\b/i);
  if (priorityMatch) return SEVERITY_HEADERS[priorityMatch[1].toUpperCase()] ?? null;

  // Pattern 5: ## Phase N: Critical ... / ## Phase N: Kritisch ...
  const phaseEnMatch = line.match(/^##\s+Phase\s+\d+[:.]\s*(Critical|High|Medium|Low)/i);
  if (phaseEnMatch) return SEVERITY_HEADERS[phaseEnMatch[1].toUpperCase()] ?? null;

  const phaseDeMatch = line.match(/^##\s+Phase\s+\d+[:.]\s*(Kritisch|Hoch|Mittel|Niedrig)/i);
  if (phaseDeMatch) return SEVERITY_HEADERS[phaseDeMatch[1].toUpperCase()] ?? null;

  // Pattern 6: ## Phase N: Sofortmassnahmen → critical (German "immediate action")
  if (/^##\s+Phase\s+\d+[:.]\s*Sofort/i.test(line)) return 'critical';

  return null;
}

/**
 * Detect inline severity from a priority line.
 * Matches: **Priority:** CRITICAL, **Priorität:** Kritisch, etc.
 */
function detectInlineSeverity(line: string): Severity | null {
  const match = line.match(
    /\*\*(?:Priorit[aä]t|Priority):\*\*\s*(Kritisch|Hoch|Mittel|Niedrig|Critical|High|Medium|Low)/i
  );
  if (match) return SEVERITY_HEADERS[match[1].toUpperCase()] ?? null;
  return null;
}

// ── Report parser ───────────────────────────────────────────────────────────

/**
 * Parse the FULL-AUDIT-REPORT.md into structured data.
 */
export function parseFullReport(markdown: string): ParsedReport {
  const overallScore = extractOverallScore(markdown);

  // Match business type in English and German
  const businessTypeMatch = markdown.match(
    /\*\*(?:Business(?:\s+Type)?(?:\s+Detected)?|Branche|Geschäftstyp(?:\s+erkannt)?|Unternehmen(?:styp)?):\*\*\s*(.+)/
  );
  const businessType = businessTypeMatch ? businessTypeMatch[1].trim().replace(/\s*[—–-]{2,}.*$/, '') : null;

  // Match pages crawled in English and German
  const pagesCrawledMatch = markdown.match(
    /\*\*(?:Pages?\s*(?:Crawled|Discovered|Analyzed)|Seiten\s*(?:insgesamt|gecrawlt|analysiert)|Indexierte\s+Seiten):\*\*\s*(\d+)/i
  );
  const pagesCrawled = pagesCrawledMatch ? parseInt(pagesCrawledMatch[1], 10) : null;

  const categories: ParsedReport['categories'] = [];

  // Parse category rows from markdown tables in any column order
  const tableRowRegex = /^\|(.+)\|$/gm;
  let rowMatch;

  while ((rowMatch = tableRowRegex.exec(markdown)) !== null) {
    const cells = rowMatch[1].split('|').map(c => c.trim());

    let catType: CategoryType | undefined;
    let weight: number | null = null;
    let score: number | null = null;
    let weightedScore: number | null = null;

    for (const cell of cells) {
      const cleanCell = cell.replace(/^\|?\s*/, '').trim();

      // Skip bold-wrapped totals row, header separators, empty cells
      if (!cleanCell || /^[-:]+$/.test(cleanCell) || /^\*{2}(?:Gesamt|Overall|Total)\*{2}$/i.test(cleanCell)) continue;

      // Check if this cell is a category name (exact then fuzzy)
      if (!catType) {
        const matched = matchCategory(cleanCell);
        if (matched) {
          catType = matched;
          continue;
        }
      }

      // Check for weight (N%)
      const weightMatch = cell.match(/^(\d+)%$/);
      if (weightMatch) {
        weight = parseInt(weightMatch[1], 10);
        continue;
      }

      // Check for score (N/100 or N / 100)
      const scoreMatch = cell.match(/^(\d+)\s*\/\s*100$/);
      if (scoreMatch) {
        score = parseInt(scoreMatch[1], 10);
        continue;
      }

      // Check for weighted score as fraction (N/M or N,N/M where M is a weight denominator)
      const fractionMatch = cell.match(/^(\d+[.,]?\d*)\s*\/\s*(\d+)$/);
      if (fractionMatch && catType && [25, 20, 10, 5].includes(parseInt(fractionMatch[2]))) {
        const ws = parseFloat(fractionMatch[1].replace(',', '.'));
        const w = parseInt(fractionMatch[2], 10);
        weight = w;
        weightedScore = ws;
        score = w > 0 ? Math.round((ws / w) * 100) : 0;
        continue;
      }

      // Check for weighted score (decimal number like 7.00, 10.5, or German 18,0)
      const weightedMatch = cell.match(/^(\d+[.,]?\d*)$/);
      if (weightedMatch && catType) {
        weightedScore = parseFloat(weightedMatch[1].replace(',', '.'));
      }
    }

    if (catType && weight !== null && score !== null) {
      // Avoid duplicates (same category type parsed from multiple table sections)
      if (!categories.some(c => c.category === catType)) {
        categories.push({
          category: catType,
          weight,
          score,
          weightedScore: weightedScore ?? (weight * score) / 100,
        });
      }
    }
  }

  // Fallback: if overallScore is 0 but categories were parsed, compute from weighted scores
  let finalScore = overallScore;
  if (finalScore === 0 && categories.length > 0) {
    finalScore = Math.round(categories.reduce((sum, c) => sum + c.weightedScore, 0));
  }

  return {
    overallScore: finalScore,
    businessType,
    pagesCrawled,
    categories,
    fullReportMd: markdown,
  };
}

// ── Action plan parser ──────────────────────────────────────────────────────

/**
 * Parse the ACTION-PLAN.md into structured issues.
 */
export function parseActionPlan(markdown: string): ParsedActionPlan {
  const issues: ParsedActionPlan['issues'] = [];
  const lines = markdown.split('\n');

  let currentSeverity: Severity = 'medium';
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
    // Detect severity from H2 headers (all formats)
    const headerSeverity = detectSeverityHeader(line);
    if (headerSeverity) {
      flushIssue();
      currentSeverity = headerSeverity;
      continue;
    }

    // Detect issue title: ### N. Title  or  ### C1. Title  or  ### H2. Title  or  ### 1.1 Title  or  ### K1. Title
    const titleMatch = line.match(/^### (?:[A-Z]?\d+(?:\.\d+)?)\.?\s+(.+)/);
    if (titleMatch) {
      flushIssue();
      currentTitle = titleMatch[1].trim();
      continue;
    }

    // Detect inline priority/severity (German and English)
    const inlineSeverity = detectInlineSeverity(line);
    if (inlineSeverity) {
      currentSeverity = inlineSeverity;
      continue;
    }

    // Detect impact line (English and German)
    const impactMatch = line.match(/^\*\*(?:Impact|Auswirkung(?:en)?|Warum|Erwartete\s+Wirkung):\*\*\s*(.+)/);
    if (impactMatch) {
      currentImpact = impactMatch[1].trim();
      continue;
    }

    // Accumulate description lines
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

// ── Validation ──────────────────────────────────────────────────────────────

export interface ParseValidation {
  valid: boolean;
  warnings: string[];
}

export function validateParsedReport(report: ParsedReport): ParseValidation {
  const warnings: string[] = [];

  if (report.overallScore === 0 && report.categories.length > 0) {
    warnings.push('Overall score is 0 but categories were parsed — score extraction likely failed');
  }

  if (report.categories.length > 0 && report.categories.length !== 7) {
    warnings.push(`Expected 7 categories, found ${report.categories.length}`);
  }

  if (report.categories.length > 0) {
    const totalWeight = report.categories.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight !== 100) {
      warnings.push(`Category weights sum to ${totalWeight}%, expected 100%`);
    }
  }

  for (const cat of report.categories) {
    if (cat.score < 0 || cat.score > 100) {
      warnings.push(`Category ${cat.category} has out-of-range score: ${cat.score}`);
    }
  }

  const seen = new Set<string>();
  for (const cat of report.categories) {
    if (seen.has(cat.category)) {
      warnings.push(`Duplicate category: ${cat.category}`);
    }
    seen.add(cat.category);
  }

  if (report.categories.length === 7 && report.overallScore > 0) {
    const computed = Math.round(report.categories.reduce((s, c) => s + c.weightedScore, 0));
    const diff = Math.abs(report.overallScore - computed);
    if (diff > 5) {
      warnings.push(
        `Overall score (${report.overallScore}) differs from weighted sum (${computed}) by ${diff} points`
      );
    }
  }

  return { valid: warnings.length === 0, warnings };
}

// ── Category guesser ────────────────────────────────────────────────────────

/**
 * Best-effort category guess from issue title and description.
 */
function guessCategory(title: string, description: string): CategoryType | null {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes('robots.txt') || text.includes('sitemap') || text.includes('crawl') ||
      text.includes('canonical') || text.includes('redirect') || text.includes('ssl') ||
      text.includes('https') || text.includes('security header') || text.includes('hsts') ||
      text.includes('indexab') || text.includes('404') || text.includes('301') ||
      text.includes('sicherheit') || text.includes('weiterleitung') || text.includes('taxonomie') ||
      text.includes('cloaking') || text.includes('bot-challenge') || text.includes('http 401')) {
    return 'technical';
  }
  if (text.includes('schema') || text.includes('json-ld') || text.includes('structured data') ||
      text.includes('organization') || text.includes('breadcrumb') ||
      text.includes('strukturierte daten')) {
    return 'schema';
  }
  if (text.includes('core web vital') || text.includes('cwv') || text.includes('lcp') ||
      text.includes('inp') || text.includes('cls') || text.includes('ttfb') ||
      text.includes('page speed') || text.includes('performance') ||
      text.includes('gzip') || text.includes('komprimierung') || text.includes('defer') ||
      text.includes('render-blocking') || text.includes('ladezeit')) {
    return 'performance';
  }
  if (text.includes('image') || text.includes('alt text') || text.includes('webp') ||
      text.includes('avif') || text.includes('lazy load') ||
      text.includes('bild') || text.includes('og:image')) {
    return 'images';
  }
  if (text.includes('e-e-a-t') || text.includes('eeat') || text.includes('content') ||
      text.includes('thin page') || text.includes('readability') || text.includes('word count') ||
      text.includes('inhalt') || text.includes('wörter') || text.includes('blog') ||
      text.includes('ratgeber') || text.includes('fallstud')) {
    return 'content';
  }
  if (text.includes('title tag') || text.includes('meta description') || text.includes('heading') ||
      text.includes('h1') || text.includes('internal link') || text.includes('anchor text') ||
      text.includes('on-page') || text.includes('keyword') ||
      text.includes('überschrift') || text.includes('titel') || text.includes('tagline') ||
      text.includes('seo-plugin')) {
    return 'on_page';
  }
  if (text.includes('ai search') || text.includes('llms.txt') || text.includes('gptbot') ||
      text.includes('ai overview') || text.includes('geo ') || text.includes('ai readiness') ||
      text.includes('ki-such') || text.includes('ki-crawler') || text.includes('ki crawler')) {
    return 'ai_readiness';
  }

  return null;
}
