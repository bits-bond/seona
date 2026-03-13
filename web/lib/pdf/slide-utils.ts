import type { Language, CategoryType } from '@/types';
import type { PdfColorPalette, PdfIssueData, PdfCategoryData } from './types';
import { label } from './labels';
import { renderInlineMarkdown } from './markdown';
import { renderProgressBarSVG, getCategoryIcon, CHART_COLORS } from './svg-charts';

const SEVERITY_BORDER: Record<string, string> = {
  critical: '#c1121f',
  high: '#cc7722',
  medium: '#d4a843',
  low: '#2a9d5a',
};

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'technicalSeo',
  content: 'contentQuality',
  on_page: 'onPageSeo',
  schema: 'schemaData',
  performance: 'performance',
  images: 'images',
  ai_readiness: 'aiReadiness',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Slide wrapper ──────────────────────────────────────────────────────

export interface SlideOpts {
  body: string;
  sectionTitle?: string;
  slideNum: number;
  totalPlaceholder?: string;
  url: string;
  lang: Language;
  p: PdfColorPalette;
  layout?: 'default' | 'cover' | 'two-col' | 'two-col-60-40';
}

export const TOTAL_PLACEHOLDER = '{{TOTAL_SLIDES}}';

export function wrapSlide(opts: SlideOpts): string {
  const { body, sectionTitle, slideNum, url, lang, p, layout = 'default' } = opts;
  const total = opts.totalPlaceholder ?? TOTAL_PLACEHOLDER;

  if (layout === 'cover') {
    return `<div class="slide slide-cover">${body}</div>`;
  }

  const isGrid = layout === 'two-col' || layout === 'two-col-60-40';
  const bodyClass = isGrid ? `slide-body ${layout}` : 'slide-body';
  const gridClass = layout === 'two-col' ? 'grid-two-col' : 'grid-two-col-60-40';

  const innerBody = isGrid ? `<div class="${gridClass}">${body}</div>` : body;

  return `<div class="slide">
  <div class="slide-header">
    <span class="slide-header-title">${sectionTitle ?? ''}</span>
    <span class="slide-header-brand">SEONA</span>
  </div>
  <div class="${bodyClass}">
    ${innerBody}
  </div>
  <div class="slide-footer">
    <span>${escapeHtml(url)}</span>
    <span>${label(lang, 'confidential')}</span>
    <span>${slideNum} / ${total}</span>
  </div>
</div>`;
}

// ── Issue card V2 ──────────────────────────────────────────────────────

/**
 * Parse structured metadata from a description blob.
 * The LLM often puts everything (Kategorie, Betroffene Seiten, etc.)
 * into the description field as one text block. Extract the structured
 * parts so we can render them as visual metadata pills.
 */
/** Strip markdown bold/italic markers and clean up stray formatting */
function stripMd(text: string): string {
  return text.replace(/\*{1,2}/g, '').replace(/_{1,2}/g, '').replace(/\s{2,}/g, ' ').trim();
}

function parseDescriptionMeta(desc: string): {
  meta: { label: string; value: string }[];
  body: string;
  actions: string;
} {
  const meta: { label: string; value: string }[] = [];
  let body = desc;
  let actions = '';

  // Common label patterns (DE + EN) — handle optional ** markdown bold around labels
  const metaPatterns: { re: RegExp; label: string }[] = [
    { re: /\*{0,2}\s*Kategorie:?\s*\*{0,2}\s*/i, label: 'Kategorie' },
    { re: /\*{0,2}\s*Category:?\s*\*{0,2}\s*/i, label: 'Category' },
    { re: /\*{0,2}\s*Betroffene Seiten:?\s*\*{0,2}\s*/i, label: 'Betroffene Seiten' },
    { re: /\*{0,2}\s*Affected Pages?:?\s*\*{0,2}\s*/i, label: 'Affected Pages' },
    { re: /\*{0,2}\s*Gesch[aä]tzter Aufwand:?\s*\*{0,2}\s*/i, label: 'Aufwand' },
    { re: /\*{0,2}\s*Estimated Effort:?\s*\*{0,2}\s*/i, label: 'Effort' },
  ];

  // Description/body boundary — handle optional ** markdown bold
  const bodyRe = /\*{0,2}\s*Beschreibung:?\s*\*{0,2}\s*/i;
  const bodyEnRe = /\*{0,2}\s*Description:?\s*\*{0,2}\s*/i;

  // Actions boundary
  const actionsRe = /\*{0,2}\s*Massnahmen:?\s*\*{0,2}\s*/i;
  const actionsEnRe = /\*{0,2}\s*(?:Actions|Recommendations|Steps):?\s*\*{0,2}\s*/i;

  // Extract actions first (everything after Massnahmen:)
  const actionsMatch = body.match(actionsRe) || body.match(actionsEnRe);
  if (actionsMatch && actionsMatch.index !== undefined) {
    actions = stripMd(body.substring(actionsMatch.index + actionsMatch[0].length));
    body = body.substring(0, actionsMatch.index).trim();
  }

  // Extract the actual description body (after Beschreibung:)
  const bodyMatch = body.match(bodyRe) || body.match(bodyEnRe);
  let prefixPart = '';
  if (bodyMatch && bodyMatch.index !== undefined) {
    prefixPart = body.substring(0, bodyMatch.index).trim();
    body = stripMd(body.substring(bodyMatch.index + bodyMatch[0].length));
  } else {
    // No explicit "Beschreibung:" marker — strip markdown from entire body
    body = stripMd(body);
  }

  // Extract metadata from the prefix part
  if (prefixPart) {
    const nextLabelRe = /\*{0,2}\s*(?:Kategorie|Category|Betroffene Seiten|Affected Pages?|Gesch[aä]tzter Aufwand|Estimated Effort|Beschreibung|Description):?\s*\*{0,2}/i;
    for (const { re, label: metaLabel } of metaPatterns) {
      const match = prefixPart.match(re);
      if (match && match.index !== undefined) {
        const afterMatch = prefixPart.substring(match.index + match[0].length);
        const nextLabel = afterMatch.match(nextLabelRe);
        const rawValue = nextLabel && nextLabel.index !== undefined
          ? afterMatch.substring(0, nextLabel.index).trim()
          : afterMatch.trim();
        const value = stripMd(rawValue);
        if (value && metaLabel !== 'Kategorie' && metaLabel !== 'Category') {
          meta.push({ label: metaLabel, value });
        }
      }
    }
  }

  return { meta, body, actions };
}

export function renderIssueCardV2(
  issue: PdfIssueData,
  index: number,
  total: number,
  lang: Language,
  p: PdfColorPalette,
): string {
  const l = (key: string) => label(lang, key);
  const sevClass = `sev-${issue.severity}`;
  const catLabel = issue.category ? l(CATEGORY_LABELS[issue.category] ?? issue.category) : '';

  // Try to parse structured data from description blob
  const parsed = parseDescriptionMeta(issue.description);

  // Use parsed body if available, otherwise fall back to raw description
  const descText = parsed.body || issue.description;
  // Use parsed actions as recommendation if the original field is empty
  const recText = issue.recommendation?.trim() || parsed.actions;
  const impactText = issue.impact?.trim() || '';

  const hasRec = !!recText;
  const hasImpact = !!impactText;
  const showDetails = hasImpact || hasRec;
  const detailsClass = showDetails ? ' has-details' : '';

  // Render metadata pills (Betroffene Seiten, Aufwand)
  const metaPills = parsed.meta.length > 0
    ? `<div class="issue-card-meta">${parsed.meta.map(m => `<span class="meta-pill"><strong>${escapeHtml(m.label)}:</strong> ${escapeHtml(m.value)}</span>`).join('')}</div>`
    : '';

  return `<div class="issue-card-v2 ${sevClass}${detailsClass}">
  <div class="issue-card-header">
    <span class="badge badge-${issue.severity}">${l(issue.severity)}</span>
    ${catLabel ? `<span class="badge-cat">${catLabel}</span>` : ''}
    <span class="issue-card-num">#${index + 1} / ${total}</span>
  </div>
  <div class="issue-card-title">${renderInlineMarkdown(issue.title)}</div>
  ${metaPills}
  <div class="issue-card-desc">${renderInlineMarkdown(descText)}</div>
  ${showDetails ? `<div class="issue-card-details"${!hasImpact || !hasRec ? ' style="grid-template-columns: 1fr;"' : ''}>
    ${hasImpact ? `<div class="issue-card-impact">
      <span class="issue-card-impact-label">${l('impact')}</span>
      ${renderInlineMarkdown(impactText)}
    </div>` : ''}
    ${hasRec ? `<div class="issue-card-rec">
      <span class="issue-card-rec-label">${l('recommendation')}</span>
      ${renderInlineMarkdown(recText)}
    </div>` : ''}
  </div>` : ''}
</div>`;
}

// ── Category card V2 ───────────────────────────────────────────────────

export function renderCategoryCardV2(
  cat: PdfCategoryData,
  index: number,
  lang: Language,
  p: PdfColorPalette,
): string {
  const l = (key: string) => label(lang, key);
  const catLabelKey = CATEGORY_LABELS[cat.category] ?? cat.category;
  const color = CHART_COLORS[index % CHART_COLORS.length];
  const iconSvg = getCategoryIcon(cat.category, color);
  const progressSvg = renderProgressBarSVG(cat.score, 160, 6, color, p);

  return `<div class="cat-card-v2">
  <div class="cat-card-top">
    <div class="cat-card-icon" style="background: ${color}15;">
      ${iconSvg}
    </div>
    <span class="cat-card-name">${l(catLabelKey)}</span>
    <span class="cat-card-score">${cat.score}<span class="cat-card-score-sub">/100</span></span>
  </div>
  <div class="cat-card-bar">${progressSvg}</div>
  <div class="cat-card-weight">${l('weight')}: ${cat.weight}%</div>
</div>`;
}

// ── Pagination helpers ─────────────────────────────────────────────────

export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Split rendered HTML into block-level chunks and pack into slide body strings.
 * Used for appendix markdown content.
 *
 * Strategy: split on block-level tags, estimate heights, pack into groups
 * that fit within maxBodyHeight pixels.
 */
export function paginateHtmlBlocks(html: string, maxBodyHeight = 680): string[] {
  // Split on block-level element boundaries
  const blockRegex = /(<(?:h[1-6]|p|ul|ol|table|pre|blockquote|div|hr)[^>]*>)/gi;
  const parts = html.split(blockRegex).filter((s) => s.trim());

  // Reassemble into complete block elements
  const blocks: string[] = [];
  let current = '';
  for (const part of parts) {
    if (blockRegex.test(part)) {
      // This is an opening tag — start new block (save previous if non-empty)
      if (current.trim()) {
        blocks.push(current);
      }
      current = part;
      // Reset lastIndex since we reuse the regex
      blockRegex.lastIndex = 0;
    } else {
      current += part;
    }
  }
  if (current.trim()) {
    blocks.push(current);
  }

  // If splitting failed, return the whole thing as one page
  if (blocks.length === 0) {
    return [html];
  }

  // Estimate height of each block
  function estimateHeight(block: string): number {
    const stripped = block.replace(/<[^>]+>/g, '');
    const charCount = stripped.length;
    const lineCount = Math.max(1, Math.ceil(charCount / 85)); // ~85 chars per line at 9pt

    if (block.match(/^<h1/i)) return 50 + lineCount * 18;
    if (block.match(/^<h2/i)) return 40 + lineCount * 16;
    if (block.match(/^<h[3-6]/i)) return 35 + lineCount * 14;
    if (block.match(/^<pre/i)) {
      const codeLines = (block.match(/\n/g) || []).length + 1;
      return 20 + codeLines * 14;
    }
    if (block.match(/^<table/i)) {
      const rows = (block.match(/<tr/gi) || []).length;
      return 30 + rows * 24;
    }
    if (block.match(/^<[uo]l/i)) {
      const items = (block.match(/<li/gi) || []).length;
      return 10 + items * 20;
    }
    if (block.match(/^<hr/i)) return 20;
    return lineCount * 18 + 10;
  }

  // Pack blocks into pages
  const pages: string[] = [];
  let currentPage = '';
  let currentHeight = 0;

  for (const block of blocks) {
    const h = estimateHeight(block);
    if (currentHeight + h > maxBodyHeight && currentPage.trim()) {
      pages.push(currentPage);
      currentPage = block;
      currentHeight = h;
    } else {
      currentPage += block;
      currentHeight += h;
    }
  }
  if (currentPage.trim()) {
    pages.push(currentPage);
  }

  return pages;
}

// ── Quick win card ─────────────────────────────────────────────────────

export function renderQuickWinCard(
  issue: PdfIssueData,
  index: number,
  p: PdfColorPalette,
): string {
  return `<div class="quick-win">
  <h3>${index + 1}. ${renderInlineMarkdown(issue.title)}</h3>
  <p>${issue.recommendation ? renderInlineMarkdown(issue.recommendation) : ''}</p>
</div>`;
}

// ── Severity badge ─────────────────────────────────────────────────────

export function severityBadge(severity: string, lang: Language): string {
  return `<span class="badge badge-${severity}">${label(lang, severity)}</span>`;
}

// ── Score rating label ─────────────────────────────────────────────────

export function getScoreLabel(score: number, lang: Language): string {
  if (score < 40) return label(lang, 'poor');
  if (score < 60) return label(lang, 'needsWork');
  if (score < 80) return label(lang, 'good');
  return label(lang, 'excellent');
}
