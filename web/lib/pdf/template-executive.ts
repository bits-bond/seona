import type { Language } from '@/types';
import type { PdfAuditData, PdfTheme } from './types';
import { getPalette } from './types';
import { label } from './labels';
import { getPdfStyles } from './styles';
import { renderScoreGaugeSVG, renderRadarChartSVG, renderBarChartSVG } from './svg-charts';
import {
  wrapSlide,
  TOTAL_PLACEHOLDER,
  renderIssueCardV2,
  renderCategoryCardV2,
  renderQuickWinCard,
  getScoreLabel,
  chunk,
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
 * Build executive summary HTML as a slide deck (5-8 slides).
 */
export function buildExecutiveHtml(data: PdfAuditData, lang: Language, theme: PdfTheme): string {
  const l = (key: string) => label(lang, key);
  const p = getPalette(theme);
  const slides: string[] = [];
  let slideNum = 0;

  const chartCategories = data.categories.map((c) => ({
    label: l(CATEGORY_LABELS[c.category] ?? c.category),
    score: c.score,
  }));

  // Issue groups
  const criticalIssues = data.issues.filter((i) => i.severity === 'critical');
  const highIssues = data.issues.filter((i) => i.severity === 'high');
  const topIssues = [...criticalIssues, ...highIssues].slice(0, 10);
  const quickWins = data.issues
    .filter((i) => (i.severity === 'medium' || i.severity === 'low') && i.recommendation)
    .slice(0, 5);

  // Severity counts for overview
  const sevCounts = {
    critical: data.issues.filter((i) => i.severity === 'critical').length,
    high: data.issues.filter((i) => i.severity === 'high').length,
    medium: data.issues.filter((i) => i.severity === 'medium').length,
    low: data.issues.filter((i) => i.severity === 'low').length,
  };

  // ── Slide 1: Cover ──
  slides.push(wrapSlide({
    layout: 'cover',
    body: `
      <div class="cover-logo">SEONA</div>
      <div class="cover-subtitle">${l('executiveSummary')}</div>
      <div class="cover-domain">${escapeHtml(data.projectUrl)}</div>
      <div class="cover-date">${formatDate(data.completedAt, lang)}</div>
      <div class="cover-score">${renderScoreGaugeSVG(data.overallScore, 220, p)}</div>
    `,
    slideNum: 0,
    url: data.projectUrl,
    lang,
    p,
  }));

  // ── Slide 2: Score Overview + Key Metrics ──
  slideNum++;
  const scoreRating = getScoreLabel(data.overallScore, lang);
  slides.push(wrapSlide({
    sectionTitle: l('scoreOverview'),
    body: `
      <div style="display: flex; gap: 32px; align-items: flex-start; margin-bottom: 20px;">
        <div class="flex-col-center" style="flex-shrink: 0;">
          ${renderScoreGaugeSVG(data.overallScore, 180, p)}
          <div class="score-label" style="font-size: 14pt; font-weight: 600; margin-top: 8px;">${scoreRating}</div>
        </div>
        <div style="flex: 1; padding-top: 12px;">
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
            <span class="severity-dot"><span class="dot" style="background: #d4a843;"></span> ${sevCounts.medium} ${l('medium')}</span>
            <span class="severity-dot"><span class="dot" style="background: #2a9d5a;"></span> ${sevCounts.low} ${l('low')}</span>
          </div>
        </div>
      </div>
      <h2 style="font-size: 11pt; margin-top: 16px; margin-bottom: 8px;">${l('categoryScores')}</h2>
      <div class="cat-grid">${data.categories.map((c, i) => renderCategoryCardV2(c, i, lang, p)).join('')}</div>
    `,
    slideNum,
    url: data.projectUrl,
    lang,
    p,
  }));

  // ── Slide 3: Charts (two-col) ──
  slideNum++;
  const radarSvg = renderRadarChartSVG(chartCategories, 240, p);
  const barSvg = renderBarChartSVG(chartCategories, 300, p, 320);
  slides.push(wrapSlide({
    layout: 'two-col',
    sectionTitle: l('charts'),
    body: `
      <div class="flex-col-center">
        <h2 style="font-size: 10pt; margin-bottom: 8px;">${lang === 'de' ? 'Radar-Übersicht' : 'Radar Overview'}</h2>
        ${radarSvg}
      </div>
      <div class="flex-col-center">
        <h2 style="font-size: 10pt; margin-bottom: 8px;">${lang === 'de' ? 'Kategorie-Vergleich' : 'Category Comparison'}</h2>
        ${barSvg}
      </div>
    `,
    slideNum,
    url: data.projectUrl,
    lang,
    p,
  }));

  // ── Slides 5-N: Top Issues (2-3 per slide) ──
  if (topIssues.length > 0) {
    const issueChunks = chunk(topIssues, 3);
    for (const [chunkIdx, issueChunk] of issueChunks.entries()) {
      slideNum++;
      const titleSuffix = issueChunks.length > 1 ? ` (${chunkIdx + 1}/${issueChunks.length})` : '';
      const cards = issueChunk
        .map((issue, i) => {
          const globalIdx = chunkIdx * 3 + i;
          return renderIssueCardV2(issue, globalIdx, topIssues.length, lang, p);
        })
        .join('');
      slides.push(wrapSlide({
        sectionTitle: `${l('topIssues')}${titleSuffix}`,
        body: cards,
        slideNum,
        url: data.projectUrl,
        lang,
        p,
      }));
    }
  }

  // ── Quick Wins slide ──
  if (quickWins.length > 0) {
    slideNum++;
    const wins = quickWins.map((w, i) => renderQuickWinCard(w, i, p)).join('');
    slides.push(wrapSlide({
      sectionTitle: l('quickWins'),
      body: `
        <p style="color: ${p.textMuted}; margin-bottom: 12px; font-size: 9pt;">
          ${lang === 'de' ? 'Diese Verbesserungen können schnell umgesetzt werden und haben eine sofortige Wirkung.' : 'These improvements can be implemented quickly for immediate impact.'}
        </p>
        ${wins}
      `,
      slideNum,
      url: data.projectUrl,
      lang,
      p,
    }));
  }

  // ── Final slide: Next Steps + CTA ──
  slideNum++;
  const steps = lang === 'de'
    ? [
      { title: 'Kritische Probleme zuerst beheben', desc: 'Konzentrieren Sie sich auf die rot markierten Probleme, die die größte Auswirkung haben.' },
      { title: 'Schnelle Erfolge umsetzen', desc: 'Setzen Sie die einfachen Verbesserungen um, die wenig Aufwand erfordern.' },
      { title: 'Fortschritte überwachen', desc: 'Führen Sie nach der Umsetzung ein erneutes Audit durch.' },
      { title: 'Regelmäßige Audits planen', desc: 'Planen Sie monatliche SEO-Audits für kontinuierliche Verbesserung.' },
    ]
    : [
      { title: 'Address critical issues first', desc: 'Focus on the red-flagged issues that have the highest impact on your SEO.' },
      { title: 'Implement quick wins', desc: 'Deploy the easy improvements that require minimal effort but yield results.' },
      { title: 'Monitor progress', desc: 'Run a follow-up audit after implementing changes to measure improvements.' },
      { title: 'Schedule regular audits', desc: 'Plan monthly SEO audits to maintain and improve your rankings.' },
    ];

  const stepsHtml = steps
    .map((s, i) => `
      <div class="step-card">
        <div class="step-num">${i + 1}</div>
        <div class="step-text">
          <strong>${s.title}</strong>
          <span>${s.desc}</span>
        </div>
      </div>
    `)
    .join('');

  slides.push(wrapSlide({
    sectionTitle: l('nextSteps'),
    body: `
      ${stepsHtml}
      <div class="cta-card">
        <h2>${l('contactUs')}</h2>
        <p>${lang === 'de' ? 'Benötigen Sie Hilfe bei der Umsetzung? Unser SEO-Team steht Ihnen zur Verfügung.' : 'Need help implementing these recommendations? Our SEO team is here to help.'}</p>
        <div class="cta-brand">SEONA SEO Services</div>
      </div>
    `,
    slideNum,
    url: data.projectUrl,
    lang,
    p,
  }));

  // ── Assemble final HTML ──
  const totalSlides = slideNum;
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${l('executiveSummary')} — ${escapeHtml(data.projectUrl)}</title>
  <style>${getPdfStyles(p)}</style>
</head>
<body>
${slides.join('\n')}
</body>
</html>`;

  return html.replaceAll(TOTAL_PLACEHOLDER, String(totalSlides));
}
