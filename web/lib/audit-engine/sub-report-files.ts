import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

interface SubReportFileMapping {
  slug: string;
  titleEn: string;
  titleDe: string;
  candidates: string[];
}

const SUB_REPORT_FILE_MAP: SubReportFileMapping[] = [
  {
    slug: 'technical',
    titleEn: 'Technical SEO',
    titleDe: 'Technisches SEO',
    candidates: ['technical-seo.md', 'technical-audit.md'],
  },
  {
    slug: 'content',
    titleEn: 'Content Quality',
    titleDe: 'Inhaltsqualität',
    candidates: ['content-audit.md', 'content-quality.md'],
  },
  {
    slug: 'schema',
    titleEn: 'Schema / Structured Data',
    titleDe: 'Schema / Strukturierte Daten',
    candidates: ['schema-audit.md', 'schema-analysis.md'],
  },
  {
    slug: 'performance',
    titleEn: 'Performance (CWV)',
    titleDe: 'Performance (CWV)',
    candidates: ['performance-audit.md', 'performance-analysis.md', 'performance.md'],
  },
  {
    slug: 'sitemap',
    titleEn: 'Sitemap Analysis',
    titleDe: 'Sitemap-Analyse',
    candidates: ['sitemap-audit.md', 'sitemap-analysis.md'],
  },
  {
    slug: 'visual',
    titleEn: 'Visual Analysis',
    titleDe: 'Visuelle Analyse',
    candidates: ['visual-audit.md', 'visual-analysis.md'],
  },
];

/**
 * Read sub-audit detail files from the output directory.
 * For each known slug, tries candidate filenames in priority order.
 */
export function readSubReportFiles(
  outputDir: string,
  language: string,
): Array<{ slug: string; title: string; content: string }> {
  const results: Array<{ slug: string; title: string; content: string }> = [];

  for (const entry of SUB_REPORT_FILE_MAP) {
    for (const candidate of entry.candidates) {
      const filePath = path.join(outputDir, candidate);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8');
        if (content.trim().length > 0) {
          results.push({
            slug: entry.slug,
            title: language === 'de' ? entry.titleDe : entry.titleEn,
            content,
          });
        }
        break; // stop at first match for this slug
      }
    }
  }

  return results;
}
