/**
 * Client-safe fallback: parse H2 sections from fullReportMd when no sub-reports exist in DB.
 * No Node.js imports — runs in the browser.
 */

export interface ParsedSection {
  slug: string;
  title: string;
  content: string;
  source: 'parsed';
}

const SECTION_SLUG_MAP: Record<string, string> = {
  // English
  'technical seo': 'technical',
  'content quality': 'content',
  'on-page seo': 'on_page',
  'schema': 'schema',
  'structured data': 'schema',
  'performance': 'performance',
  'core web vitals': 'performance',
  'images': 'images',
  'ai search readiness': 'ai_readiness',
  'e-e-a-t': 'content',
  // German
  'technisches seo': 'technical',
  'technische seo': 'technical',
  'inhaltsqualität': 'content',
  'on-page-seo': 'on_page',
  'schema / strukturierte daten': 'schema',
  'performance / core web vitals': 'performance',
  'bilder': 'images',
  'ki-suchbereitschaft': 'ai_readiness',
  'e-e-a-t-bewertung': 'content',
};

/**
 * Map a section heading to a canonical slug.
 * Strips numbering like "1. " or "7. " and score suffixes like "(72/100)".
 */
function matchSlug(heading: string): { slug: string; title: string } | null {
  // Remove leading number: "1. Technisches SEO (72/100)" → "Technisches SEO (72/100)"
  let cleaned = heading.replace(/^\d+\.\s*/, '');
  // Extract title before score: "Technisches SEO (72/100)" → "Technisches SEO"
  const title = cleaned.replace(/\s*\([\d,.]+\s*\/\s*\d+\)\s*$/, '').trim();
  const lower = title.toLowerCase();

  // Try exact match first
  if (SECTION_SLUG_MAP[lower]) {
    return { slug: SECTION_SLUG_MAP[lower], title };
  }

  // Try partial match
  for (const [key, slug] of Object.entries(SECTION_SLUG_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return { slug, title };
    }
  }

  return null;
}

/**
 * Parse fullReportMd into sections by H2 headers.
 * Returns sections mapped to known category slugs.
 */
export function parseReportSections(fullReportMd: string): ParsedSection[] {
  if (!fullReportMd) return [];

  const sections: ParsedSection[] = [];
  const lines = fullReportMd.split('\n');

  let currentHeading: string | null = null;
  let currentSlug: string | null = null;
  let currentTitle: string | null = null;
  let currentContent: string[] = [];

  const flush = () => {
    if (currentSlug && currentTitle && currentContent.length > 0) {
      const content = currentContent.join('\n').trim();
      if (content.length > 100) {
        sections.push({
          slug: currentSlug,
          title: currentTitle,
          content,
          source: 'parsed',
        });
      }
    }
    currentHeading = null;
    currentSlug = null;
    currentTitle = null;
    currentContent = [];
  };

  for (const line of lines) {
    // Match H2 headers: ## Title or ## N. Title (N/100)
    const h2Match = line.match(/^## (.+)/);
    if (h2Match) {
      flush();
      const heading = h2Match[1].trim();
      const match = matchSlug(heading);
      if (match) {
        currentHeading = heading;
        currentSlug = match.slug;
        currentTitle = match.title;
      }
      continue;
    }

    // Skip separator lines
    if (line.match(/^---+$/)) continue;

    if (currentSlug) {
      currentContent.push(line);
    }
  }

  flush();
  return sections;
}
