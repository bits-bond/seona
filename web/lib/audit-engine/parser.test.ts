import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parseFullReport, parseActionPlan, validateParsedReport } from './parser';

// ── Helpers ─────────────────────────────────────────────────────────────────

const OUTPUT_DIR = resolve(__dirname, '../../../output');

function readOutputFile(domain: string, filename: string): string | null {
  const filePath = resolve(OUTPUT_DIR, domain, filename);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf-8');
}

// ── parseFullReport: score extraction (all tiers) ───────────────────────────

describe('parseFullReport — score extraction', () => {
  test('Tier 1: canonical format — Overall SEO Health Score: N/100', () => {
    const md = `# Report\n\n### Overall SEO Health Score: 42/100\n\n| Category | Weight | Score | Weighted |\n`;
    expect(parseFullReport(md).overallScore).toBe(42);
  });

  test('Tier 2: SEO Health Score without "Overall"', () => {
    const md = `# Report\n\n### SEO Health Score: 42/100\n`;
    expect(parseFullReport(md).overallScore).toBe(42);
  });

  test('Tier 2: SEO-Gesundheitswert (German)', () => {
    const md = `# Report\n\n### SEO-Gesundheitswert: 44 / 100\n`;
    expect(parseFullReport(md).overallScore).toBe(44);
  });

  test('Tier 2: SEO-Gesundheitsbewertung (German variant)', () => {
    const md = `# Report\n\n### SEO-Gesundheitsbewertung: 49 / 100\n`;
    expect(parseFullReport(md).overallScore).toBe(49);
  });

  test('Tier 3: Gesamtbewertung on next line after ## heading', () => {
    const md = `# Report\n\n## SEO-Gesundheitswert\n\n### Gesamtbewertung: 22 / 100\n`;
    expect(parseFullReport(md).overallScore).toBe(22);
  });

  test('spaces in score: 29 / 100', () => {
    const md = `# Report\n\n### Overall SEO Health Score: 29 / 100\n`;
    expect(parseFullReport(md).overallScore).toBe(29);
  });

  test('no spaces in score: 28/100', () => {
    const md = `# Report\n\n### Overall SEO Health Score: 28/100\n`;
    expect(parseFullReport(md).overallScore).toBe(28);
  });

  test('fallback: compute from weighted sum when score label not found', () => {
    const md = `# Report\n\n| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 25% | 80/100 | 20.0 |
| Content Quality | 25% | 60/100 | 15.0 |
| On-Page SEO | 20% | 50/100 | 10.0 |
| Schema / Structured Data | 10% | 40/100 | 4.0 |
| Performance (CWV) | 10% | 30/100 | 3.0 |
| Images | 5% | 20/100 | 1.0 |
| AI Search Readiness | 5% | 10/100 | 0.5 |\n`;
    const result = parseFullReport(md);
    // No score label → computed from weighted sum = 53.5 → 54
    expect(result.overallScore).toBe(54);
  });
});

// ── parseFullReport: category matching ──────────────────────────────────────

describe('parseFullReport — category matching', () => {
  test('standard English category names', () => {
    const md = `### Overall SEO Health Score: 29/100\n
| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 25% | 42/100 | 10.5 |
| Content Quality | 25% | 5/100 | 1.25 |
| On-Page SEO | 20% | 25/100 | 5.0 |
| Schema / Structured Data | 10% | 0/100 | 0.0 |
| Performance (CWV) | 10% | 99/100 | 9.9 |
| Images | 5% | 50/100 | 2.5 |
| AI Search Readiness | 5% | 5/100 | 0.25 |\n`;
    const result = parseFullReport(md);
    expect(result.overallScore).toBe(29);
    expect(result.categories).toHaveLength(7);
    expect(result.categories.map(c => c.category).sort()).toEqual(
      ['ai_readiness', 'content', 'images', 'on_page', 'performance', 'schema', 'technical']
    );
  });

  test('reversed column order: Score | Weight (httpbin.org format)', () => {
    const md = `### Overall SEO Health Score: 22/100\n
| Category | Score | Weight | Weighted | Status |
|----------|-------|--------|----------|--------|
| Technical SEO | 28/100 | 25% | 7.00 | FAIL |
| Content Quality | 23/100 | 25% | 5.75 | FAIL |
| On-Page SEO | 20/100 | 20% | 4.00 | FAIL |
| Schema / Structured Data | 0/100 | 10% | 0.00 | FAIL |
| Performance (CWV) | 30/100 | 10% | 3.00 | FAIL |
| Images | 50/100 | 5% | 2.50 | N/A |
| AI Search Readiness | 8/100 | 5% | 0.40 | FAIL |\n`;
    const result = parseFullReport(md);
    expect(result.overallScore).toBe(22);
    expect(result.categories).toHaveLength(7);
    expect(result.categories.find(c => c.category === 'technical')?.score).toBe(28);
    expect(result.categories.find(c => c.category === 'images')?.score).toBe(50);
  });

  test('German with umlauts and comma decimals (svb-kuehltau.de format)', () => {
    const md = `### SEO-Gesundheitswert: 44 / 100\n
| Kategorie | Gewicht | Punkte | Gewichtet |
|-----------|---------|--------|-----------|
| Technisches SEO | 25% | 72/100 | 18,0 |
| Inhaltsqualität | 25% | 42/100 | 10,5 |
| On-Page SEO | 20% | 48/100 | 9,6 |
| Schema / Strukturierte Daten | 10% | 25/100 | 2,5 |
| Performance (CWV) | 10% | 58/100 | 5,8 |
| Bilder | 5% | 55/100 | 2,8 |
| KI-Suchbereitschaft | 5% | 28/100 | 1,4 |\n`;
    const result = parseFullReport(md);
    expect(result.overallScore).toBe(44);
    expect(result.categories).toHaveLength(7);
    expect(result.categories.find(c => c.category === 'technical')?.score).toBe(72);
    expect(result.categories.find(c => c.category === 'content')?.score).toBe(42);
  });

  test('German with SEO-Gesundheitsbewertung + umlaut-free names (svb-kuehlthau.de format)', () => {
    const md = `### SEO-Gesundheitsbewertung: 49 / 100\n
| Kategorie | Gewicht | Bewertung | Gewichtete Punkte |
|-----------|---------|-----------|-------------------|
| Technisches SEO | 25% | 58 / 100 | 14,5 / 25 |
| Inhaltsqualitaet | 25% | 50 / 100 | 12,5 / 25 |
| On-Page SEO | 20% | 60 / 100 | 12,0 / 20 |
| Schema / Structured Data | 10% | 20 / 100 | 2,0 / 10 |
| Performance (Core Web Vitals) | 10% | 40 / 100 | 4,0 / 10 |
| Bildoptimierung | 5% | 45 / 100 | 2,3 / 5 |
| KI-Suchbereitschaft | 5% | 25 / 100 | 1,3 / 5 |\n`;
    const result = parseFullReport(md);
    expect(result.overallScore).toBe(49);
    expect(result.categories).toHaveLength(7);
    // These were previously failing:
    expect(result.categories.find(c => c.category === 'content')?.score).toBe(50);
    expect(result.categories.find(c => c.category === 'performance')?.score).toBe(40);
    expect(result.categories.find(c => c.category === 'images')?.score).toBe(46); // 2.3/5 * 100 = 46 (rounded)
  });

  test('German with Gesamtbewertung + Content-Qualitaet (jun.legal format)', () => {
    const md = `## SEO-Gesundheitswert\n\n### Gesamtbewertung: 22 / 100\n
| Kategorie | Gewicht | Punkte | Gewichtet | Status |
|-----------|---------|--------|-----------|--------|
| Technisches SEO | 25% | 38/100 | 9,5 | KRITISCH |
| Content-Qualitaet | 25% | 28/100 | 7,0 | KRITISCH |
| On-Page SEO | 20% | 18/100 | 3,6 | KRITISCH |
| Schema / Strukturierte Daten | 10% | 0/100 | 0,0 | MANGELHAFT |
| Performance (CWV) | 10% | 20/100 | 2,0 | SCHLECHT |
| Bilder | 5% | 25/100 | 1,3 | SCHLECHT |
| KI-Suchbereitschaft | 5% | 8/100 | 0,4 | MANGELHAFT |\n`;
    const result = parseFullReport(md);
    expect(result.overallScore).toBe(22);
    expect(result.categories).toHaveLength(7);
    // This was previously failing — Content-Qualitaet not in map
    expect(result.categories.find(c => c.category === 'content')?.score).toBe(28);
  });

  test('German with fraction weighted scores (bitsandbond.com format)', () => {
    const md = `### SEO-Gesundheitswert: 28 / 100\n
| Kategorie | Gewicht | Score | Gewichtet | Status |
|---|---|---|---|---|
| Technisches SEO | 25% | 38/100 | 9,5/25 | Mangelhaft |
| Inhaltsqualität | 25% | 22/100 | 5,5/25 | Kritisch |
| On-Page SEO | 20% | 30/100 | 6,0/20 | Mangelhaft |
| Schema / Structured Data | 10% | 0/100 | 0,0/10 | Kritisch |
| Performance (CWV) | 10% | 30/100 | 3,0/10 | Mangelhaft |
| Bilder | 5% | 12/100 | 0,6/5 | Kritisch |
| KI-Suchbereitschaft | 5% | 10/100 | 0,5/5 | Kritisch |\n`;
    const result = parseFullReport(md);
    expect(result.overallScore).toBe(28);
    expect(result.categories).toHaveLength(7);
    expect(result.categories.find(c => c.category === 'technical')?.score).toBe(38);
  });

  test('no duplicate categories from multiple tables in same report', () => {
    const md = `### Overall SEO Health Score: 42/100\n
| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 25% | 49/100 | 12.25 |
| Content Quality | 25% | 47/100 | 11.75 |
| On-Page SEO | 20% | 45/100 | 9.00 |
| Schema / Structured Data | 10% | 15/100 | 1.50 |
| Performance (CWV) | 10% | 40/100 | 4.00 |
| Images | 5% | 35/100 | 1.75 |
| AI Search Readiness | 5% | 42/100 | 2.10 |

## Methodology
| Category | Weight | Description |
|----------|--------|-------------|
| Technical SEO | 25% | Foundation for all other SEO |
| Content Quality | 25% | E-E-A-T directly impacts rankings |
| Performance | 10% | Core Web Vitals are a ranking signal |\n`;
    const result = parseFullReport(md);
    expect(result.categories).toHaveLength(7);
    // Ensure no duplicates
    const types = result.categories.map(c => c.category);
    expect(new Set(types).size).toBe(7);
  });
});

// ── parseFullReport: business type and pages ────────────────────────────────

describe('parseFullReport — metadata extraction', () => {
  test('English business type', () => {
    const md = `### Overall SEO Health Score: 22/100\n**Business Type Detected:** Developer Tool / API Testing Service\n`;
    expect(parseFullReport(md).businessType).toBe('Developer Tool / API Testing Service');
  });

  test('German Branche', () => {
    const md = `### SEO-Gesundheitswert: 28 / 100\n**Branche:** Creator Management / Influencer-Marketing-Agentur\n`;
    expect(parseFullReport(md).businessType).toBe('Creator Management / Influencer-Marketing-Agentur');
  });

  test('English pages crawled', () => {
    const md = `### Overall SEO Health Score: 22/100\n**Pages Crawled:** 12\n`;
    expect(parseFullReport(md).pagesCrawled).toBe(12);
  });

  test('German Seiten gecrawlt', () => {
    const md = `### SEO-Gesundheitswert: 28 / 100\n**Seiten gecrawlt:** 7\n`;
    expect(parseFullReport(md).pagesCrawled).toBe(7);
  });
});

// ── parseActionPlan: severity detection ─────────────────────────────────────

describe('parseActionPlan — severity detection', () => {
  test('English: ## CRITICAL ... ## HIGH ...', () => {
    const md = `## CRITICAL -- Fix Immediately (Week 1)\n\n### 1. No compression\n\nDesc\n\n### 2. No viewport\n\nDesc\n\n## HIGH -- Fix Within 2 Weeks\n\n### 3. No schema\n\nDesc\n`;
    const result = parseActionPlan(md);
    expect(result.issues).toHaveLength(3);
    expect(result.issues[0].severity).toBe('critical');
    expect(result.issues[0].title).toBe('No compression');
    expect(result.issues[1].severity).toBe('critical');
    expect(result.issues[2].severity).toBe('high');
  });

  test('English: ## Critical Priority (...)', () => {
    const md = `## Critical Priority (Fix Immediately)\n\n### C1. Fix robots.txt\n\nDesc\n\n## High Priority (Fix Within 1 Week)\n\n### H1. Add schema\n\nDesc\n`;
    const result = parseActionPlan(md);
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0].severity).toBe('critical');
    expect(result.issues[1].severity).toBe('high');
  });

  test('German: ## KRITISCH -- Sofort umsetzen', () => {
    const md = `## KRITISCH -- Sofort umsetzen\n\n### K1. Bot-Challenge deaktivieren\n\nBeschreibung\n\n## HOCH -- In 1-2 Wochen\n\n### H1. SEO-Plugin installieren\n\nBeschreibung\n`;
    const result = parseActionPlan(md);
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0].severity).toBe('critical');
    expect(result.issues[0].title).toBe('Bot-Challenge deaktivieren');
    expect(result.issues[1].severity).toBe('high');
  });

  test('German: ## Kritisch — Sofort beheben (with em dash)', () => {
    const md = `## Kritisch — Sofort beheben\n\n### 1.1 JSON-LD implementieren\n\nBeschreibung\n\n## Hoch — In 2 Wochen\n\n### 2.1 Heading-Struktur korrigieren\n\nBeschreibung\n`;
    const result = parseActionPlan(md);
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0].severity).toBe('critical');
    expect(result.issues[1].severity).toBe('high');
  });

  test('Phase-based with inline Priority (binary.builders format)', () => {
    const md = `## Phase 1: Critical Foundation Fixes (Week 1)\n\n### C1. Add Meta Descriptions\n**Priority:** CRITICAL | **Category:** On-Page\n\nDesc\n\n### C2. Add Canonical Tags\n**Priority:** CRITICAL | **Category:** Technical\n\nDesc\n\n## Phase 2: High Priority (Week 2)\n\n### H1. Add Schema\n**Priority:** HIGH\n\nDesc\n`;
    const result = parseActionPlan(md);
    expect(result.issues).toHaveLength(3);
    expect(result.issues[0].severity).toBe('critical');
    expect(result.issues[1].severity).toBe('critical');
    expect(result.issues[2].severity).toBe('high');
  });

  test('German inline Priorität (svb-kuehltau.de format)', () => {
    const md = `## Phase 1: Sofortmassnahmen\n\n### 1.1 WordPress-Untertitel korrigieren\n\n- **Priorität:** Kritisch\n\nBeschreibung\n\n### 1.2 Taxonomy entfernen\n\n- **Priorität:** Hoch\n\nBeschreibung\n`;
    const result = parseActionPlan(md);
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0].severity).toBe('critical');
    expect(result.issues[1].severity).toBe('high');
  });
});

// ── parseActionPlan: title extraction ───────────────────────────────────────

describe('parseActionPlan — title extraction', () => {
  test('### N. Title (standard)', () => {
    const md = `## CRITICAL\n\n### 1. Fix robots.txt\n\nDesc\n\n### 2. Add meta descriptions\n\nDesc\n`;
    const result = parseActionPlan(md);
    expect(result.issues[0].title).toBe('Fix robots.txt');
    expect(result.issues[1].title).toBe('Add meta descriptions');
  });

  test('### CN. Title (prefixed)', () => {
    const md = `## CRITICAL\n\n### C1. Add Meta Descriptions\n\nDesc\n`;
    expect(parseActionPlan(md).issues[0].title).toBe('Add Meta Descriptions');
  });

  test('### KN. Title (German prefix)', () => {
    const md = `## KRITISCH\n\n### K1. Bot-Challenge deaktivieren\n\nDesc\n`;
    expect(parseActionPlan(md).issues[0].title).toBe('Bot-Challenge deaktivieren');
  });

  test('### N.N Title (hierarchical)', () => {
    const md = `## CRITICAL\n\n### 1.1 JSON-LD implementieren\n\nDesc\n`;
    expect(parseActionPlan(md).issues[0].title).toBe('JSON-LD implementieren');
  });
});

// ── validateParsedReport ────────────────────────────────────────────────────

describe('validateParsedReport', () => {
  test('valid report with 7 categories', () => {
    const report = parseFullReport(`### Overall SEO Health Score: 29/100\n
| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 25% | 42/100 | 10.5 |
| Content Quality | 25% | 5/100 | 1.25 |
| On-Page SEO | 20% | 25/100 | 5.0 |
| Schema / Structured Data | 10% | 0/100 | 0.0 |
| Performance (CWV) | 10% | 99/100 | 9.9 |
| Images | 5% | 50/100 | 2.5 |
| AI Search Readiness | 5% | 5/100 | 0.25 |\n`);
    const validation = validateParsedReport(report);
    expect(validation.valid).toBe(true);
    expect(validation.warnings).toHaveLength(0);
  });

  test('warns on missing categories', () => {
    const report = parseFullReport(`### Overall SEO Health Score: 20/100\n
| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 25% | 42/100 | 10.5 |
| Content Quality | 25% | 5/100 | 1.25 |\n`);
    const validation = validateParsedReport(report);
    expect(validation.valid).toBe(false);
    expect(validation.warnings).toContain('Expected 7 categories, found 2');
  });

  test('warns on duplicate categories', () => {
    // This shouldn't happen with the dedup logic, but test the validator itself
    const report = {
      overallScore: 50,
      businessType: null,
      pagesCrawled: null,
      categories: [
        { category: 'technical' as const, weight: 25, score: 50, weightedScore: 12.5 },
        { category: 'technical' as const, weight: 25, score: 60, weightedScore: 15 },
      ],
      fullReportMd: '',
    };
    const validation = validateParsedReport(report);
    expect(validation.warnings.some(w => w.includes('Duplicate'))).toBe(true);
  });
});

// ── Integration tests: real output files ────────────────────────────────────

describe('parseFullReport — real output files', () => {
  const EXPECTED: Record<string, { score: number; categories: number }> = {
    'watchmen.io': { score: 28, categories: 7 },
    'httpbin.org': { score: 22, categories: 7 },
    'example.com': { score: 29, categories: 7 },
    'binary.builders': { score: 42, categories: 7 },
    'svb-kuehltau.de': { score: 44, categories: 7 },
    'svb-kuehlthau.de': { score: 49, categories: 7 },
    'jun.legal': { score: 22, categories: 7 },
    'bitsandbond.com': { score: 28, categories: 7 },
  };

  for (const [domain, expected] of Object.entries(EXPECTED)) {
    test(`${domain}: score=${expected.score}, ${expected.categories} categories`, () => {
      const md = readOutputFile(domain, 'FULL-AUDIT-REPORT.md');
      if (!md) {
        // Skip if output file doesn't exist (CI environment)
        return;
      }
      const result = parseFullReport(md);
      expect(result.overallScore).toBe(expected.score);
      expect(result.categories).toHaveLength(expected.categories);

      // Validate weights sum to 100
      const totalWeight = result.categories.reduce((sum, c) => sum + c.weight, 0);
      expect(totalWeight).toBe(100);

      // All scores 0-100
      for (const cat of result.categories) {
        expect(cat.score).toBeGreaterThanOrEqual(0);
        expect(cat.score).toBeLessThanOrEqual(100);
      }

      // No duplicates
      const types = result.categories.map(c => c.category);
      expect(new Set(types).size).toBe(expected.categories);
    });
  }
});

describe('parseActionPlan — real output files', () => {
  const EXPECTED_MIN_ISSUES: Record<string, number> = {
    'watchmen.io': 5,
    'httpbin.org': 5,
    'example.com': 5,
    'binary.builders': 5,
    'svb-kuehltau.de': 5,
    'svb-kuehlthau.de': 5,
    'jun.legal': 5,
    'bitsandbond.com': 3,
  };

  for (const [domain, minIssues] of Object.entries(EXPECTED_MIN_ISSUES)) {
    test(`${domain}: at least ${minIssues} issues parsed`, () => {
      const md = readOutputFile(domain, 'ACTION-PLAN.md');
      if (!md) return;
      const result = parseActionPlan(md);
      expect(result.issues.length).toBeGreaterThanOrEqual(minIssues);

      // First issue should have a non-empty title
      expect(result.issues[0].title.length).toBeGreaterThan(0);

      // At least one issue should be critical or high
      const hasCriticalOrHigh = result.issues.some(
        i => i.severity === 'critical' || i.severity === 'high'
      );
      expect(hasCriticalOrHigh).toBe(true);
    });
  }
});
