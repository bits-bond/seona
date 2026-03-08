import type { Language } from '@/types';
import type { PdfAuditData } from './types';
import { label } from './labels';
import { PDF_STYLES } from './styles';
import { renderScoreGaugeSVG, renderRadarChartSVG } from './svg-charts';

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'technicalSeo',
  content: 'contentQuality',
  on_page: 'onPageSeo',
  schema: 'schemaData',
  performance: 'performance',
  images: 'images',
  ai_readiness: 'aiReadiness',
};

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

/**
 * Build executive summary HTML (2-5 pages):
 * Page 1: Cover
 * Page 2: Scores + Radar + Top Issues
 * Page 3: Quick Wins
 * Page 4: Next Steps + Contact
 */
export function buildExecutiveHtml(data: PdfAuditData, lang: Language): string {
  const l = (key: string) => label(lang, key);

  // Prepare category data for charts
  const chartCategories = data.categories.map((c) => ({
    label: l(CATEGORY_LABELS[c.category] ?? c.category),
    score: c.score,
  }));

  // Top issues: critical and high severity, max 8
  const topIssues = data.issues
    .filter((i) => i.severity === 'critical' || i.severity === 'high')
    .slice(0, 8);

  // Quick wins: medium/low severity with recommendations, max 5
  const quickWins = data.issues
    .filter((i) => (i.severity === 'medium' || i.severity === 'low') && i.recommendation)
    .slice(0, 5);

  const scoreGaugeSvg = renderScoreGaugeSVG(data.overallScore, 180);
  const radarSvg = renderRadarChartSVG(chartCategories, 280);

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${l('executiveSummary')} — ${data.projectUrl}</title>
  <style>${PDF_STYLES}</style>
</head>
<body>

  <!-- Page 1: Cover -->
  <div class="cover-page">
    <div class="cover-logo">SEONA</div>
    <div class="cover-subtitle">${l('executiveSummary')}</div>
    <div class="cover-domain">${data.projectUrl}</div>
    <div class="cover-date">${formatDate(data.completedAt)}</div>
    <div class="cover-score">
      ${scoreGaugeSvg}
    </div>
  </div>

  <!-- Page 2: Scores + Radar + Top Issues -->
  <div class="section">
    <h1>${l('seoHealthScore')}</h1>

    <div class="charts-row">
      <div class="chart-container">
        ${scoreGaugeSvg}
      </div>
      <div class="chart-container">
        ${radarSvg}
      </div>
    </div>

    <h2>${l('categoryScores')}</h2>
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
      topIssues.length > 0
        ? `
    <h2>${l('topIssues')}</h2>
    ${topIssues
      .map(
        (issue) => `
      <div class="issue-card">
        <h3>${severityBadge(issue.severity, lang)} ${issue.title}</h3>
        <p>${issue.description}</p>
        ${issue.impact ? `<p class="impact"><strong>${l('impact')}:</strong> ${issue.impact}</p>` : ''}
      </div>`,
      )
      .join('')}`
        : ''
    }
  </div>

  <!-- Page 3: Quick Wins -->
  ${
    quickWins.length > 0
      ? `
  <div class="section">
    <h1>${l('quickWins')}</h1>
    <p style="color: #8888a0; margin-bottom: 20px;">${lang === 'de' ? 'Diese Verbesserungen können schnell umgesetzt werden und haben eine sofortige Wirkung.' : 'These improvements can be implemented quickly for immediate impact.'}</p>
    ${quickWins
      .map(
        (win, i) => `
      <div class="quick-win">
        <h3>${i + 1}. ${win.title}</h3>
        <p>${win.recommendation}</p>
      </div>`,
      )
      .join('')}
  </div>`
      : ''
  }

  <!-- Page 4: Next Steps + Contact -->
  <div class="section">
    <h1>${l('nextSteps')}</h1>
    <div class="next-steps">
      <ol>
        <li><strong>${lang === 'de' ? 'Kritische Probleme zuerst beheben' : 'Address critical issues first'}</strong> — ${lang === 'de' ? 'Konzentrieren Sie sich auf die rot markierten Probleme, die die größte Auswirkung haben.' : 'Focus on the red-flagged issues that have the highest impact on your SEO performance.'}</li>
        <li><strong>${lang === 'de' ? 'Schnelle Erfolge umsetzen' : 'Implement quick wins'}</strong> — ${lang === 'de' ? 'Setzen Sie die einfachen Verbesserungen um, die wenig Aufwand erfordern.' : 'Deploy the easy improvements that require minimal effort but yield measurable results.'}</li>
        <li><strong>${lang === 'de' ? 'Fortschritte überwachen' : 'Monitor progress'}</strong> — ${lang === 'de' ? 'Führen Sie nach der Umsetzung ein erneutes Audit durch, um die Verbesserungen zu messen.' : 'Run a follow-up audit after implementing changes to measure improvements.'}</li>
        <li><strong>${lang === 'de' ? 'Regelmäßige Audits planen' : 'Schedule regular audits'}</strong> — ${lang === 'de' ? 'Planen Sie monatliche SEO-Audits, um Ihre Rankings zu halten und zu verbessern.' : 'Plan monthly SEO audits to maintain and improve your rankings.'}</li>
      </ol>
    </div>

    <div style="margin-top: 48px; padding: 24px; background: #12121a; border: 1px solid #2a2a3e; border-radius: 12px; text-align: center;">
      <h2 style="margin-top: 0;">${l('contactUs')}</h2>
      <p style="color: #8888a0;">${lang === 'de' ? 'Benötigen Sie Hilfe bei der Umsetzung? Unser SEO-Team steht Ihnen zur Verfügung.' : 'Need help implementing these recommendations? Our SEO team is here to help.'}</p>
      <p style="color: #e05a33; font-weight: 600; margin-top: 12px;">SEONA SEO Services</p>
    </div>
  </div>

</body>
</html>`;
}
