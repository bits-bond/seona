import type { Language, CategoryType } from '@/types';
import type { PdfAuditData } from './types';
import { label } from './labels';
import { PDF_STYLES } from './styles';
import {
  renderScoreGaugeSVG,
  renderRadarChartSVG,
  renderBarChartSVG,
} from './svg-charts';

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

function severityBadge(severity: string, lang: Language): string {
  return `<span class="badge badge-${severity}">${label(lang, severity)}</span>`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build full technical report HTML (15-25 pages):
 * Cover, TOC, Executive Summary, 7 Category Sections,
 * Action Plan, Screenshots, Appendix
 */
export function buildFullReportHtml(data: PdfAuditData, lang: Language): string {
  const l = (key: string) => label(lang, key);

  const chartCategories = data.categories.map((c) => ({
    label: l(CATEGORY_LABELS[c.category] ?? c.category),
    score: c.score,
  }));

  const scoreGaugeSvg = renderScoreGaugeSVG(data.overallScore, 200);
  const radarSvg = renderRadarChartSVG(chartCategories, 320);
  const barSvg = renderBarChartSVG(chartCategories, 480);

  // Group issues by category
  const issuesByCategory = new Map<CategoryType, typeof data.issues>();
  for (const issue of data.issues) {
    const cat = issue.category ?? 'technical';
    if (!issuesByCategory.has(cat)) {
      issuesByCategory.set(cat, []);
    }
    issuesByCategory.get(cat)!.push(issue);
  }

  // Group issues by severity for action plan
  const issuesBySeverity = {
    critical: data.issues.filter((i) => i.severity === 'critical'),
    high: data.issues.filter((i) => i.severity === 'high'),
    medium: data.issues.filter((i) => i.severity === 'medium'),
    low: data.issues.filter((i) => i.severity === 'low'),
  };

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${l('fullReport')} — ${data.projectUrl}</title>
  <style>${PDF_STYLES}</style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-logo">SEONA</div>
    <div class="cover-subtitle">${l('fullReport')}</div>
    <div class="cover-domain">${data.projectUrl}</div>
    ${data.businessType ? `<div class="cover-date">${data.businessType}</div>` : ''}
    <div class="cover-date">${formatDate(data.completedAt)}</div>
    <div class="cover-score">
      ${scoreGaugeSvg}
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="section toc">
    <h1>${l('tableOfContents')}</h1>
    <div class="toc-item"><span class="toc-label">1. ${l('executiveSummary')}</span></div>
    <div class="toc-item"><span class="toc-label">2. ${l('categoryScores')}</span></div>
    ${CATEGORY_ORDER.map(
      (cat, i) =>
        `<div class="toc-item" style="padding-left: 20px;"><span class="toc-label">2.${i + 1} ${l(CATEGORY_LABELS[cat])}</span></div>`,
    ).join('')}
    <div class="toc-item"><span class="toc-label">3. ${l('actionPlan')}</span></div>
    ${data.screenshots.length > 0 ? `<div class="toc-item"><span class="toc-label">4. ${l('screenshots')}</span></div>` : ''}
    <div class="toc-item"><span class="toc-label">${data.screenshots.length > 0 ? '5' : '4'}. ${l('appendix')}</span></div>
  </div>

  <!-- Section 1: Executive Summary -->
  <div class="section">
    <h1>1. ${l('executiveSummary')}</h1>

    <div class="charts-row">
      <div class="chart-container">
        ${scoreGaugeSvg}
      </div>
      <div class="chart-container">
        ${radarSvg}
      </div>
    </div>

    <div style="margin: 8px 0 16px;">
      <p><strong>${l('businessType')}:</strong> ${data.businessType ?? '—'}</p>
      <p><strong>${l('pagesCrawled')}:</strong> ${data.pagesCrawled ?? '—'}</p>
      <p><strong>${l('completedOn')}:</strong> ${formatDate(data.completedAt)}</p>
    </div>

    <h2>${l('categoryScores')}</h2>
    <div class="chart-container">
      ${barSvg}
    </div>

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
            (c) => `
          <tr>
            <td>${l(CATEGORY_LABELS[c.category] ?? c.category)}</td>
            <td><strong>${c.score}</strong>/100</td>
            <td>${c.weight}%</td>
          </tr>`,
          )
          .join('')}
      </tbody>
    </table>

    ${
      issuesBySeverity.critical.length > 0
        ? `
    <h2>${l('topIssues')}</h2>
    ${issuesBySeverity.critical
      .slice(0, 5)
      .map(
        (issue) => `
      <div class="issue-card">
        <h3>${severityBadge(issue.severity, lang)} ${escapeHtml(issue.title)}</h3>
        <p>${escapeHtml(issue.description)}</p>
        ${issue.impact ? `<p class="impact"><strong>${l('impact')}:</strong> ${escapeHtml(issue.impact)}</p>` : ''}
      </div>`,
      )
      .join('')}`
        : ''
    }
  </div>

  <!-- Section 2: Category Deep Dives -->
  ${CATEGORY_ORDER.map((cat, catIdx) => {
    const catData = data.categories.find((c) => c.category === cat);
    const catIssues = issuesByCategory.get(cat) ?? [];
    const catLabel = l(CATEGORY_LABELS[cat]);
    const catScore = catData?.score ?? 0;

    return `
  <div class="section">
    <h1>2.${catIdx + 1} ${catLabel}</h1>

    <div class="category-grid" style="grid-template-columns: 1fr;">
      <div class="category-card" style="display: flex; align-items: center; gap: 24px;">
        ${renderScoreGaugeSVG(catScore, 100)}
        <div>
          <div class="cat-score" style="font-size: 24pt; color: #e8e8ed;">${catScore}<span style="font-size: 14pt; color: #8888a0;">/100</span></div>
          <div class="cat-weight">${l('weight')}: ${catData?.weight ?? 0}%</div>
        </div>
      </div>
    </div>

    ${
      catIssues.length > 0
        ? `
    <h2>${l('issue')}${lang === 'en' ? 's' : ''} (${catIssues.length})</h2>
    ${catIssues
      .map(
        (issue) => `
      <div class="issue-card">
        <h3>${severityBadge(issue.severity, lang)} ${escapeHtml(issue.title)}</h3>
        <p>${escapeHtml(issue.description)}</p>
        ${issue.impact ? `<p class="impact"><strong>${l('impact')}:</strong> ${escapeHtml(issue.impact)}</p>` : ''}
        ${issue.recommendation ? `<div class="recommendation"><strong>${l('recommendation')}:</strong> ${escapeHtml(issue.recommendation)}</div>` : ''}
      </div>`,
      )
      .join('')}`
        : `<p style="color: #8888a0;">${lang === 'de' ? 'Keine Probleme in dieser Kategorie gefunden.' : 'No issues found in this category.'}</p>`
    }
  </div>`;
  }).join('')}

  <!-- Section 3: Action Plan -->
  <div class="section">
    <h1>3. ${l('actionPlan')}</h1>

    ${(['critical', 'high', 'medium', 'low'] as const)
      .filter((sev) => issuesBySeverity[sev].length > 0)
      .map(
        (sev) => `
    <h2>${severityBadge(sev, lang)} ${l(sev)} (${issuesBySeverity[sev].length})</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 5%">#</th>
          <th style="width: 35%">${l('issue')}</th>
          <th style="width: 60%">${l('recommendation')}</th>
        </tr>
      </thead>
      <tbody>
        ${issuesBySeverity[sev]
          .map(
            (issue, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(issue.title)}</td>
          <td>${issue.recommendation ? escapeHtml(issue.recommendation) : '—'}</td>
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>`,
      )
      .join('')}
  </div>

  <!-- Section 4: Screenshots -->
  ${
    data.screenshots.length > 0
      ? `
  <div class="section">
    <h1>4. ${l('screenshots')}</h1>
    <div class="screenshot-grid">
      ${data.screenshots
        .map(
          (ss) => `
        <div class="screenshot-item">
          <img src="${ss.dataUri}" alt="${ss.page} ${ss.device} ${ss.type}" />
          <div class="caption">${ss.page} — ${ss.device} — ${ss.type}</div>
        </div>`,
        )
        .join('')}
    </div>
  </div>`
      : ''
  }

  <!-- Appendix -->
  <div class="section">
    <h1>${data.screenshots.length > 0 ? '5' : '4'}. ${l('appendix')}</h1>

    <h2>${l('fullReport')}</h2>
    <div class="markdown-content">
      ${data.fullReportMd ? simpleMarkdownToHtml(data.fullReportMd) : `<p style="color: #8888a0;">${lang === 'de' ? 'Kein vollständiger Bericht verfügbar.' : 'No full report available.'}</p>`}
    </div>
  </div>

</body>
</html>`;
}

/**
 * Simple markdown to HTML converter for embedding reports.
 * Handles headings, bold, lists, links, code blocks, and paragraphs.
 */
function simpleMarkdownToHtml(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let inCodeBlock = false;
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  for (const line of lines) {
    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        html.push('</code></pre>');
        inCodeBlock = false;
      } else {
        if (inList) {
          html.push(`</${listType}>`);
          inList = false;
        }
        html.push('<pre><code>');
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(escapeHtml(line));
      continue;
    }

    // Close list if line doesn't continue it
    if (inList && !line.match(/^\s*[-*]\s/) && !line.match(/^\s*\d+\.\s/) && line.trim() !== '') {
      html.push(`</${listType}>`);
      inList = false;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^\s*[-*]\s+(.+)/);
    if (ulMatch) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      html.push(`<li>${inlineFormat(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\s*\d+\.\s+(.+)/);
    if (olMatch) {
      if (!inList) {
        html.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      html.push(`<li>${inlineFormat(olMatch[1])}</li>`);
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      html.push('<hr>');
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      continue;
    }

    // Table row
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      // Skip separator rows
      if (line.match(/^\|[\s-:|]+\|$/)) continue;
      const cells = line.split('|').filter((c) => c.trim() !== '');
      const tag = html.length > 0 && html[html.length - 1]?.includes('<table>') ? 'td' : 'td';
      html.push(`<tr>${cells.map((c) => `<${tag}>${inlineFormat(c.trim())}</${tag}>`).join('')}</tr>`);
      if (!html.some((h) => h.includes('<table>'))) {
        html.splice(html.length - 1, 0, '<table>');
      }
      continue;
    }

    // Regular paragraph
    html.push(`<p>${inlineFormat(line)}</p>`);
  }

  if (inList) html.push(`</${listType}>`);
  if (inCodeBlock) html.push('</code></pre>');

  return html.join('\n');
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
