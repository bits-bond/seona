import type { Language, CategoryType } from '@/types';
import type { PdfAuditData, PdfTheme } from './types';
import { getPalette } from './types';
import { label } from './labels';
import { getPdfStyles } from './styles';
import {
  renderScoreGaugeSVG,
  renderRadarChartSVG,
  renderBarChartSVG,
} from './svg-charts';
import { renderMarkdown, renderInlineMarkdown } from './markdown';
import {
  wrapSlide,
  TOTAL_PLACEHOLDER,
  renderIssueCardV2,
  renderCategoryCardV2,
  severityBadge,
  getScoreLabel,
  chunk,
  paginateHtmlBlocks,
} from './slide-utils';

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'technicalSeo',
  content: 'contentQuality',
  on_page: 'onPageSeo',
  schema: 'schemaData',
  performance: 'performance',
  images: 'images',
  ai_readiness: 'aiReadiness',
};

const CATEGORY_ORDER: CategoryType[] = [
  'technical',
  'content',
  'on_page',
  'schema',
  'performance',
  'images',
  'ai_readiness',
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(date: Date, lang: Language): string {
  return new Date(date).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Build full technical report HTML as a slide deck (15-30 slides).
 */
export function buildFullReportHtml(data: PdfAuditData, lang: Language, theme: PdfTheme): string {
  const l = (key: string) => label(lang, key);
  const p = getPalette(theme);
  const slides: string[] = [];
  let slideNum = 0;

  const chartCategories = data.categories.map((c) => ({
    label: l(CATEGORY_LABELS[c.category] ?? c.category),
    score: c.score,
  }));

  // Group issues by category
  const issuesByCategory = new Map<CategoryType, typeof data.issues>();
  for (const issue of data.issues) {
    const cat = issue.category ?? ('technical' as CategoryType);
    if (!issuesByCategory.has(cat)) {
      issuesByCategory.set(cat, []);
    }
    issuesByCategory.get(cat)!.push(issue);
  }

  // Group issues by severity
  const issuesBySeverity = {
    critical: data.issues.filter((i) => i.severity === 'critical'),
    high: data.issues.filter((i) => i.severity === 'high'),
    medium: data.issues.filter((i) => i.severity === 'medium'),
    low: data.issues.filter((i) => i.severity === 'low'),
  };

  const sevCounts = {
    critical: issuesBySeverity.critical.length,
    high: issuesBySeverity.high.length,
    medium: issuesBySeverity.medium.length,
    low: issuesBySeverity.low.length,
  };

  // ══════════════════════════════════════════════════════════════════════
  // Slide 1: Cover
  // ══════════════════════════════════════════════════════════════════════
  slides.push(wrapSlide({
    layout: 'cover',
    body: `
      <div class="cover-logo">SEONA</div>
      <div class="cover-subtitle">${l('fullReport')}</div>
      <div class="cover-domain">${escapeHtml(data.projectUrl)}</div>
      ${data.businessType ? `<div class="cover-date">${escapeHtml(data.businessType)}</div>` : ''}
      <div class="cover-date">${formatDate(data.completedAt, lang)}</div>
      <div class="cover-score">${renderScoreGaugeSVG(data.overallScore, 220, p)}</div>
    `,
    slideNum: 0,
    url: data.projectUrl,
    lang,
    p,
  }));

  // ══════════════════════════════════════════════════════════════════════
  // Slide 2: Table of Contents
  // ══════════════════════════════════════════════════════════════════════
  slideNum++;
  const tocItems = [
    `<div class="toc-item"><span class="toc-label">1. ${l('executiveSummary')}</span></div>`,
    `<div class="toc-item"><span class="toc-label">2. ${l('categoryScores')}</span></div>`,
    ...CATEGORY_ORDER.map(
      (cat, i) =>
        `<div class="toc-item toc-indent"><span class="toc-label">2.${i + 1} ${l(CATEGORY_LABELS[cat])}</span></div>`,
    ),
    `<div class="toc-item"><span class="toc-label">3. ${l('actionPlan')}</span></div>`,
    ...(data.screenshots.length > 0
      ? [`<div class="toc-item"><span class="toc-label">4. ${l('screenshots')}</span></div>`]
      : []),
    `<div class="toc-item"><span class="toc-label">${data.screenshots.length > 0 ? '5' : '4'}. ${l('appendix')}</span></div>`,
  ];
  slides.push(wrapSlide({
    sectionTitle: l('tableOfContents'),
    body: tocItems.join(''),
    slideNum,
    url: data.projectUrl,
    lang,
    p,
  }));

  // ══════════════════════════════════════════════════════════════════════
  // Slide 3: Executive Summary (two-col)
  // ══════════════════════════════════════════════════════════════════════
  slideNum++;
  const scoreRating = getScoreLabel(data.overallScore, lang);
  const radarSvg = renderRadarChartSVG(chartCategories, 250, p);
  slides.push(wrapSlide({
    layout: 'two-col',
    sectionTitle: `1. ${l('executiveSummary')}`,
    body: `
      <div class="flex-col-center">
        ${renderScoreGaugeSVG(data.overallScore, 180, p)}
        <div class="score-label" style="font-size: 12pt; font-weight: 600; margin-top: 6px;">${scoreRating}</div>
        <div style="margin-top: 16px;">
          ${radarSvg}
        </div>
      </div>
      <div>
        <div class="metric-row">
          <span class="metric-label">${l('businessType')}</span>
          <span class="metric-value">${escapeHtml(data.businessType ?? '—')}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">${l('pagesCrawled')}</span>
          <span class="metric-value">${data.pagesCrawled ?? '—'}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">${l('completedOn')}</span>
          <span class="metric-value">${formatDate(data.completedAt, lang)}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">${l('totalIssues')}</span>
          <span class="metric-value">${data.issues.length}</span>
        </div>
        <div class="severity-dots" style="margin-top: 12px;">
          <span class="severity-dot"><span class="dot" style="background: #c1121f;"></span> ${sevCounts.critical} ${l('critical')}</span>
          <span class="severity-dot"><span class="dot" style="background: #cc7722;"></span> ${sevCounts.high} ${l('high')}</span>
        </div>
        <div class="severity-dots">
          <span class="severity-dot"><span class="dot" style="background: #d4a843;"></span> ${sevCounts.medium} ${l('medium')}</span>
          <span class="severity-dot"><span class="dot" style="background: #2a9d5a;"></span> ${sevCounts.low} ${l('low')}</span>
        </div>

        <h2 style="margin-top: 20px; font-size: 11pt;">${l('categoryScores')}</h2>
        <table>
          <thead>
            <tr>
              <th>${l('category')}</th>
              <th>${l('score')}</th>
              <th>${l('weight')}</th>
            </tr>
          </thead>
          <tbody>
            ${data.categories
              .map(
                (c) => `<tr>
                <td>${l(CATEGORY_LABELS[c.category] ?? c.category)}</td>
                <td><strong>${c.score}</strong>/100</td>
                <td>${c.weight}%</td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `,
    slideNum,
    url: data.projectUrl,
    lang,
    p,
  }));

  // ══════════════════════════════════════════════════════════════════════
  // Slide 4: Category Overview (grid + bar chart)
  // ══════════════════════════════════════════════════════════════════════
  slideNum++;
  const catCards = data.categories.map((c, i) => renderCategoryCardV2(c, i, lang, p)).join('');
  const barSvg = renderBarChartSVG(chartCategories, 480, p);
  slides.push(wrapSlide({
    sectionTitle: l('categoryOverview'),
    body: `
      <div class="cat-grid">${catCards}</div>
      <div class="chart-container" style="margin-top: 8px;">
        ${barSvg}
      </div>
    `,
    slideNum,
    url: data.projectUrl,
    lang,
    p,
  }));

  // ══════════════════════════════════════════════════════════════════════
  // Slides 5-6: Top Issues Summary (critical + high)
  // ══════════════════════════════════════════════════════════════════════
  const topIssues = [...issuesBySeverity.critical, ...issuesBySeverity.high].slice(0, 8);
  if (topIssues.length > 0) {
    const issueChunks = chunk(topIssues, 3);
    for (const [chunkIdx, issueChunk] of issueChunks.entries()) {
      slideNum++;
      const suffix = issueChunks.length > 1 ? ` (${chunkIdx + 1}/${issueChunks.length})` : '';
      const cards = issueChunk
        .map((issue, i) => renderIssueCardV2(issue, chunkIdx * 3 + i, topIssues.length, lang, p))
        .join('');
      slides.push(wrapSlide({
        sectionTitle: `${l('topIssues')}${suffix}`,
        body: cards,
        slideNum,
        url: data.projectUrl,
        lang,
        p,
      }));
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // Slides 7-20: Per-Category Deep Dives
  // ══════════════════════════════════════════════════════════════════════
  for (const [catIdx, cat] of CATEGORY_ORDER.entries()) {
    const catData = data.categories.find((c) => c.category === cat);
    const catIssues = issuesByCategory.get(cat) ?? [];
    const catLabel = l(CATEGORY_LABELS[cat]);
    const catScore = catData?.score ?? 0;

    // Category header slide
    slideNum++;
    const issueCountText = catIssues.length > 0
      ? `${catIssues.length} ${l('issuesFound')}`
      : l('noIssues');
    const sevBreakdown = catIssues.length > 0
      ? (() => {
          const counts = {
            critical: catIssues.filter((i) => i.severity === 'critical').length,
            high: catIssues.filter((i) => i.severity === 'high').length,
            medium: catIssues.filter((i) => i.severity === 'medium').length,
            low: catIssues.filter((i) => i.severity === 'low').length,
          };
          return `<div class="severity-dots" style="margin-top: 8px;">
            ${counts.critical > 0 ? `<span class="severity-dot"><span class="dot" style="background: #c1121f;"></span> ${counts.critical} ${l('critical')}</span>` : ''}
            ${counts.high > 0 ? `<span class="severity-dot"><span class="dot" style="background: #cc7722;"></span> ${counts.high} ${l('high')}</span>` : ''}
            ${counts.medium > 0 ? `<span class="severity-dot"><span class="dot" style="background: #d4a843;"></span> ${counts.medium} ${l('medium')}</span>` : ''}
            ${counts.low > 0 ? `<span class="severity-dot"><span class="dot" style="background: #2a9d5a;"></span> ${counts.low} ${l('low')}</span>` : ''}
          </div>`;
        })()
      : '';

    slides.push(wrapSlide({
      layout: 'two-col-60-40',
      sectionTitle: `2.${catIdx + 1} ${catLabel}`,
      body: `
        <div class="flex-col-center">
          ${renderScoreGaugeSVG(catScore, 180, p)}
          <div class="score-label" style="font-size: 12pt; font-weight: 600; margin-top: 6px;">${getScoreLabel(catScore, lang)}</div>
        </div>
        <div style="display: flex; flex-direction: column; justify-content: center;">
          <h2 style="margin-top: 0; font-size: 13pt;">${catLabel}</h2>
          <div class="metric-row">
            <span class="metric-label">${l('score')}</span>
            <span class="metric-value">${catScore}/100</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">${l('weight')}</span>
            <span class="metric-value">${catData?.weight ?? 0}%</span>
          </div>
          <div style="margin-top: 12px; font-size: 10pt; color: ${p.textSecondary};">
            ${issueCountText}
          </div>
          ${sevBreakdown}
        </div>
      `,
      slideNum,
      url: data.projectUrl,
      lang,
      p,
    }));

    // Category issue slides (2 per slide)
    if (catIssues.length > 0) {
      const catChunks = chunk(catIssues, 2);
      for (const [ci, issueChunk] of catChunks.entries()) {
        slideNum++;
        const suffix = catChunks.length > 1 ? ` (${ci + 1}/${catChunks.length})` : '';
        const issueSuffix = catChunks.length > 1 ? ` — ${l('issue')}${lang === 'en' ? 's' : ''}${suffix}` : ` — ${l('issue')}${lang === 'en' ? 's' : ''}`;
        const cards = issueChunk
          .map((issue, i) => renderIssueCardV2(issue, ci * 2 + i, catIssues.length, lang, p))
          .join('');
        slides.push(wrapSlide({
          sectionTitle: `2.${catIdx + 1} ${catLabel}${issueSuffix}`,
          body: cards,
          slideNum,
          url: data.projectUrl,
          lang,
          p,
        }));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // Action Plan slides
  // ══════════════════════════════════════════════════════════════════════
  const severities = (['critical', 'high', 'medium', 'low'] as const).filter(
    (sev) => issuesBySeverity[sev].length > 0,
  );

  for (const sev of severities) {
    const sevIssues = issuesBySeverity[sev];
    const tableChunks = chunk(sevIssues, 8);
    for (const [ti, tableChunk] of tableChunks.entries()) {
      slideNum++;
      const suffix = tableChunks.length > 1 ? ` (${ti + 1}/${tableChunks.length})` : '';
      const rows = tableChunk
        .map(
          (issue, i) => `<tr>
          <td>${ti * 8 + i + 1}</td>
          <td>${renderInlineMarkdown(issue.title)}</td>
          <td>${issue.recommendation ? renderInlineMarkdown(issue.recommendation) : '—'}</td>
        </tr>`,
        )
        .join('');
      slides.push(wrapSlide({
        sectionTitle: `3. ${l('actionPlan')} — ${severityBadge(sev, lang)}${suffix}`,
        body: `
          <table>
            <thead>
              <tr>
                <th style="width: 5%">#</th>
                <th style="width: 35%">${l('issue')}</th>
                <th style="width: 60%">${l('recommendation')}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `,
        slideNum,
        url: data.projectUrl,
        lang,
        p,
      }));
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // Screenshots slides (2 per slide)
  // ══════════════════════════════════════════════════════════════════════
  if (data.screenshots.length > 0) {
    const ssChunks = chunk(data.screenshots, 2);
    for (const [si, ssChunk] of ssChunks.entries()) {
      slideNum++;
      const suffix = ssChunks.length > 1 ? ` (${si + 1}/${ssChunks.length})` : '';
      const ssHtml = ssChunk
        .map(
          (ss) => `<div class="screenshot-item">
          <img src="${ss.dataUri}" alt="${escapeHtml(ss.page)} ${ss.device} ${ss.type}" />
          <div class="caption">${escapeHtml(ss.page)} — ${ss.device} — ${ss.type}</div>
        </div>`,
        )
        .join('');
      slides.push(wrapSlide({
        sectionTitle: `${data.screenshots.length > 0 ? '4' : '—'}. ${l('screenshots')}${suffix}`,
        body: `<div class="screenshot-grid">${ssHtml}</div>`,
        slideNum,
        url: data.projectUrl,
        lang,
        p,
      }));
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // Appendix slides (paginated markdown)
  // ══════════════════════════════════════════════════════════════════════
  const appendixNum = data.screenshots.length > 0 ? '5' : '4';
  if (data.fullReportMd) {
    const mdHtml = renderMarkdown(data.fullReportMd);
    const pages = paginateHtmlBlocks(mdHtml);
    for (const [pi, pageHtml] of pages.entries()) {
      slideNum++;
      const pageSuffix = pages.length > 1 ? ` (${pi + 1}/${pages.length})` : '';
      slides.push(wrapSlide({
        sectionTitle: `${appendixNum}. ${l('appendix')}${pageSuffix}`,
        body: `<div class="markdown-content">${pageHtml}</div>`,
        slideNum,
        url: data.projectUrl,
        lang,
        p,
      }));
    }
  } else {
    slideNum++;
    slides.push(wrapSlide({
      sectionTitle: `${appendixNum}. ${l('appendix')}`,
      body: `<p style="color: ${p.textMuted};">${lang === 'de' ? 'Kein vollständiger Bericht verfügbar.' : 'No full report available.'}</p>`,
      slideNum,
      url: data.projectUrl,
      lang,
      p,
    }));
  }

  // ── Assemble final HTML ──
  const totalSlides = slideNum;
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${l('fullReport')} — ${escapeHtml(data.projectUrl)}</title>
  <style>${getPdfStyles(p)}</style>
</head>
<body>
${slides.join('\n')}
</body>
</html>`;

  return html.replaceAll(TOTAL_PLACEHOLDER, String(totalSlides));
}
