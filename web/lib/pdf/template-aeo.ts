import { aeoLabel, scoreRating } from './i18n-aeo';
import type { ActionItem, BrandConfig, Run, Score, SuggestRecommendation } from '../aeo/types';
import type { EeatRec } from '../aeo/artifacts/eeat-recommendations';

type Lang = 'de' | 'en';

export interface AeoReportInput {
  run: Run;
  score: Score;
  config: BrandConfig;
  actionItems: ActionItem[];
  competitorGaps: SuggestRecommendation[];
  eeat: EeatRec[];
  artifacts: {
    llmsTxt: string;
    robotsPatch: { diff: string; changes: string[] };
    schemaJsonLdCombined: string;
  };
  language?: Lang;
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(date: string | Date, lang: Lang): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function severityColor(s: ActionItem['severity']): string {
  return { critical: '#c1121f', high: '#cc7722', medium: '#d4a843', low: '#2a9d5a' }[s];
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

function gaugeSvg(score: number, accent: string): string {
  const radius = 90;
  const stroke = 14;
  const cx = 110;
  const cy = 110;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const ratingColor = score >= 80 ? '#2a9d5a' : score >= 60 ? '#88b04b' : score >= 40 ? '#d4a843' : score >= 20 ? '#cc7722' : '#c1121f';
  return `
  <svg width="220" height="220" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${radius}" stroke="#e5e7eb" stroke-width="${stroke}" fill="none" />
    <circle cx="${cx}" cy="${cy}" r="${radius}" stroke="${ratingColor}" stroke-width="${stroke}"
      fill="none" stroke-linecap="round"
      stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
      transform="rotate(-90 ${cx} ${cy})" />
    <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="Inter, sans-serif" font-size="48" font-weight="700" fill="#1a1a2e">${score}</text>
    <text x="${cx}" y="${cy + 32}" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" font-weight="500" fill="#6b7280">/ 100</text>
    <circle cx="${cx}" cy="${cy}" r="${radius - stroke / 2 - 4}" fill="none" stroke="${accent}" stroke-width="1" opacity="0.1" />
  </svg>`;
}

function providerBar(label: string, value: number, accent: string): string {
  return `
    <div class="prov-row">
      <div class="prov-label">${esc(label)}</div>
      <div class="prov-bar"><div class="prov-fill" style="width:${value}%; background:${accent}"></div></div>
      <div class="prov-val">${value}%</div>
    </div>`;
}

function styles(accent: string): string {
  return `
    :root { --accent: ${accent}; --text:#1a1a2e; --muted:#6b7280; --border:#e5e7eb; --card:#fafafa; --bg:#ffffff; }
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin:0; padding:0; font-family: 'Inter', -apple-system, system-ui, sans-serif; color:var(--text); background:var(--bg); }
    .page { width: 210mm; min-height: 297mm; padding: 18mm 16mm; page-break-after: always; position: relative; }
    .page:last-of-type { page-break-after: auto; }
    .header { display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 18px; }
    .header .logo { font-weight: 700; letter-spacing: 0.15em; font-size: 11px; color: var(--accent); }
    .header .meta { font-size: 10px; color: var(--muted); }
    .footer { position:absolute; left:16mm; right:16mm; bottom:10mm; display:flex; justify-content:space-between; font-size:9px; color: var(--muted); border-top: 1px solid var(--border); padding-top: 6px; }
    h1 { font-size: 30px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: -0.01em; }
    h2 { font-size: 18px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: -0.005em; }
    h3 { font-size: 13px; font-weight: 600; margin: 18px 0 6px 0; }
    p, li { line-height: 1.55; font-size: 11px; }
    .lead { font-size: 13px; color: var(--muted); margin-bottom: 18px; }
    .cover { display:flex; flex-direction:column; justify-content:center; height: 261mm; text-align:left; }
    .cover .brand-name { font-size: 56px; font-weight: 800; letter-spacing:-0.02em; margin:8px 0 4px 0; }
    .cover .brand-domain { color: var(--muted); margin-bottom: 32px; font-size: 16px; }
    .cover .tagline { font-size: 14px; color: var(--muted); max-width: 480px; margin-bottom: 40px; }
    .cover .meta-row { display:flex; gap: 28px; font-size: 11px; color: var(--muted); }
    .cover .meta-row strong { display:block; color: var(--text); font-size: 14px; }
    .cover .accent { color: var(--accent); }
    .summary-grid { display: grid; grid-template-columns: 240px 1fr; gap: 28px; align-items: start; }
    .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .kpi { padding: 12px 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--card); }
    .kpi .label { font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .kpi .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
    .kpi .sub { font-size: 10px; color: var(--muted); margin-top: 2px; }
    .interp-box { padding: 14px 16px; background: rgba(224, 90, 51, 0.06); border-left: 3px solid var(--accent); border-radius: 0 6px 6px 0; font-size: 12px; line-height: 1.6; }
    .prov-row { display:flex; align-items:center; gap: 10px; margin: 6px 0; font-size: 11px; }
    .prov-label { width: 100px; color: var(--muted); }
    .prov-bar { flex: 1; height: 8px; background: var(--card); border-radius: 4px; overflow: hidden; }
    .prov-fill { height: 100%; border-radius: 4px; }
    .prov-val { width: 36px; text-align: right; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; }
    th { text-align: left; padding: 8px 6px; border-bottom: 1.5px solid var(--text); color: var(--muted); font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 8px 6px; border-bottom: 1px solid var(--border); vertical-align: top; }
    tbody tr:hover { background: rgba(0,0,0,0.01); }
    .badge { display:inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.04em; }
    .action-item { border: 1px solid var(--border); border-left: 4px solid var(--border); border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; }
    .action-item .head { display:flex; justify-content:space-between; align-items:center; gap: 12px; }
    .action-item .title { font-weight: 600; font-size: 12px; }
    .action-item .meta { font-size: 9px; color: var(--muted); }
    .action-item .desc { font-size: 10.5px; color: var(--text); margin-top: 6px; white-space: pre-wrap; line-height: 1.55; }
    pre.code { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 6px; font-family: 'Menlo','Courier New',monospace; font-size: 9px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; line-height: 1.5; }
    .artifact-card { border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; background: var(--card); }
    .artifact-card .head { font-weight: 600; font-size: 12px; margin-bottom: 2px; }
    .artifact-card .desc { font-size: 10px; color: var(--muted); margin-bottom: 8px; }
    .gap-card { border: 1px solid var(--border); border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; }
    .gap-card h4 { margin: 0 0 4px 0; font-size: 12px; font-weight: 600; }
    .gap-card .gap-desc { font-size: 10.5px; color: var(--muted); margin-bottom: 6px; }
    .gap-card ol { margin: 4px 0 0 18px; padding: 0; }
    .gap-card li { margin-bottom: 4px; font-size: 11px; }
    .eeat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .eeat-item { border: 1px solid var(--border); border-radius: 6px; padding: 10px 12px; }
    .eeat-item .area { font-weight: 600; font-size: 11px; margin-bottom: 4px; color: var(--accent); }
    .eeat-item .desc { font-size: 10px; line-height: 1.5; }
    .eeat-item .tags { margin-top: 6px; display: flex; gap: 6px; }
    .tag { font-size: 8px; padding: 2px 6px; border-radius: 3px; background: var(--card); border: 1px solid var(--border); color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .scroll-pre { max-height: 160mm; overflow: hidden; }
  `;
}

function renderCover(input: AeoReportInput, lang: Lang): string {
  const { config, run } = input;
  return `
    <div class="page cover">
      <div class="logo accent" style="font-size: 11px; letter-spacing: 0.2em; font-weight: 700;">SEONA · AEO</div>
      <div class="brand-name">${esc(config.brandName)}</div>
      <div class="brand-domain">${esc(config.domain)}</div>
      <div class="tagline">${aeoLabel(lang, 'aeoSubtitle')}</div>
      <div class="meta-row">
        <div><strong>${esc(formatDate(run.timestamp, lang))}</strong>${aeoLabel(lang, 'generatedOn')}</div>
        <div><strong>${run.prompts.length}</strong>${aeoLabel(lang, 'promptsTracked')}</div>
        <div><strong>${run.providers.length}</strong>${aeoLabel(lang, 'providers')}</div>
        <div><strong>${config.competitors.length}</strong>${aeoLabel(lang, 'competitorTracking')}</div>
      </div>
    </div>`;
}

function renderSummary(input: AeoReportInput, lang: Lang): string {
  const { score, config, run } = input;
  const accent = config.accentColor || '#e05a33';
  const rating = scoreRating(lang, score.overall);
  const providerBars = run.providers
    .map((p) => providerBar(p, score.perProvider[p] ?? 0, accent))
    .join('');
  return `
    <div class="page">
      ${pageHeader(config, lang, 1)}
      <h1>${aeoLabel(lang, 'visibilityScore')}</h1>
      <p class="lead">${aeoLabel(lang, 'aeoSubtitle')}</p>
      <div class="summary-grid">
        <div style="text-align:center;">
          ${gaugeSvg(score.overall, accent)}
          <div style="font-size: 13px; font-weight: 600; margin-top: 4px;">${esc(rating)}</div>
        </div>
        <div>
          <div class="kpi-grid">
            <div class="kpi">
              <div class="label">${aeoLabel(lang, 'brandCitationRate')}</div>
              <div class="value">${pct(score.brandCitationRate)}</div>
              <div class="sub">${esc(config.brandName)}</div>
            </div>
            <div class="kpi">
              <div class="label">${aeoLabel(lang, 'bestCompetitor')}</div>
              <div class="value">${pct(score.bestCompetitorRate)}</div>
              <div class="sub">${aeoLabel(lang, 'gap')}: ${Math.round(score.gapPoints)} ${lang === 'de' ? 'Punkte' : 'points'}</div>
            </div>
          </div>
          <h3>${aeoLabel(lang, 'perProvider')}</h3>
          ${providerBars}
        </div>
      </div>
      <h3 style="margin-top: 22px;">${aeoLabel(lang, 'interpretation')}</h3>
      <div class="interp-box">${esc(score.interpretation)}</div>
      ${pageFooter(config, lang, 1)}
    </div>`;
}

function renderPromptCoverage(input: AeoReportInput, lang: Lang, pageNum: number): string {
  const rows = input.score.perPrompt
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 18)
    .map((p) => {
      const topComp = p.topCompetitor ?? '—';
      const topCompRate = p.topCompetitor ? p.competitorRates[p.topCompetitor] ?? 0 : 0;
      return `
        <tr>
          <td>${esc(p.promptText.slice(0, 70))}${p.promptText.length > 70 ? '…' : ''}</td>
          <td>${esc(p.provider)}</td>
          <td>${pct(p.brandRate)}</td>
          <td>${esc(topComp)} (${pct(topCompRate)})</td>
          <td>${pct(p.gap)}</td>
        </tr>`;
    })
    .join('');
  return `
    <div class="page">
      ${pageHeader(input.config, lang, pageNum)}
      <h1>${aeoLabel(lang, 'promptCoverage')}</h1>
      <p class="lead">${aeoLabel(lang, 'promptCoverageDesc')}</p>
      <table>
        <thead>
          <tr>
            <th>${aeoLabel(lang, 'promptHeader')}</th>
            <th>${aeoLabel(lang, 'providerHeader')}</th>
            <th>${aeoLabel(lang, 'brandRateHeader')}</th>
            <th>${aeoLabel(lang, 'competitorRateHeader')}</th>
            <th>${aeoLabel(lang, 'gapHeader')}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${pageFooter(input.config, lang, pageNum)}
    </div>`;
}

function renderActionPlan(input: AeoReportInput, lang: Lang, pageNum: number): string {
  const cards = input.actionItems
    .slice(0, 12)
    .map((item) => {
      const color = severityColor(item.severity);
      const sevLabel = aeoLabel(lang, item.severity);
      return `
        <div class="action-item" style="border-left-color:${color}">
          <div class="head">
            <div class="title">${esc(item.title)}</div>
            <div>
              <span class="badge" style="background:${color}">${esc(sevLabel)}</span>
              <span class="meta" style="margin-left: 8px;">${aeoLabel(lang, 'impactLabel')} ${item.impactScore} · ${aeoLabel(lang, 'effortLabel')} ${item.effortScore}</span>
            </div>
          </div>
          <div class="desc">${esc(item.description)}</div>
        </div>`;
    })
    .join('');
  return `
    <div class="page">
      ${pageHeader(input.config, lang, pageNum)}
      <h1>${aeoLabel(lang, 'actionPlan')}</h1>
      <p class="lead">${aeoLabel(lang, 'actionPlanDesc')}</p>
      ${cards}
      ${pageFooter(input.config, lang, pageNum)}
    </div>`;
}

function renderCompetitorGaps(input: AeoReportInput, lang: Lang, pageNum: number): string {
  if (input.competitorGaps.length === 0) return '';
  const cards = input.competitorGaps
    .slice(0, 5)
    .map((g) => {
      const recList = g.recommendations.map((r) => `<li>${esc(r)}</li>`).join('');
      return `
        <div class="gap-card">
          <h4>${esc(g.competitor)}</h4>
          <div class="gap-desc">${esc(g.gapDescription)}</div>
          <ol>${recList}</ol>
        </div>`;
    })
    .join('');
  return `
    <div class="page">
      ${pageHeader(input.config, lang, pageNum)}
      <h1>${aeoLabel(lang, 'competitorGaps')}</h1>
      <p class="lead">${aeoLabel(lang, 'competitorGapsDesc')}</p>
      ${cards}
      ${pageFooter(input.config, lang, pageNum)}
    </div>`;
}

function renderArtifacts(input: AeoReportInput, lang: Lang, pageNum: number): string {
  const robotsLines = input.artifacts.robotsPatch.diff.split('\n').slice(0, 24).join('\n');
  const llmsPreview = input.artifacts.llmsTxt.split('\n').slice(0, 24).join('\n');
  const schemaPreview = input.artifacts.schemaJsonLdCombined.slice(0, 1400);
  return `
    <div class="page">
      ${pageHeader(input.config, lang, pageNum)}
      <h1>${aeoLabel(lang, 'artifacts')}</h1>
      <p class="lead">${aeoLabel(lang, 'artifactsDesc')}</p>
      <div class="artifact-card">
        <div class="head">${aeoLabel(lang, 'llmsTxt')}</div>
        <div class="desc">${aeoLabel(lang, 'llmsTxtDesc')}</div>
        <pre class="code scroll-pre">${esc(llmsPreview)}</pre>
      </div>
      <div class="artifact-card">
        <div class="head">${aeoLabel(lang, 'robotsPatch')}</div>
        <div class="desc">${aeoLabel(lang, 'robotsPatchDesc')}</div>
        <pre class="code scroll-pre">${esc(robotsLines)}</pre>
      </div>
      ${pageFooter(input.config, lang, pageNum)}
    </div>
    <div class="page">
      ${pageHeader(input.config, lang, pageNum + 1)}
      <h1>${aeoLabel(lang, 'schemaJsonLd')}</h1>
      <p class="lead">${aeoLabel(lang, 'schemaJsonLdDesc')}</p>
      <div class="artifact-card">
        <pre class="code">${esc(schemaPreview)}</pre>
      </div>
      ${pageFooter(input.config, lang, pageNum + 1)}
    </div>`;
}

function renderEeat(input: AeoReportInput, lang: Lang, pageNum: number): string {
  const items = input.eeat
    .map((e) => `
      <div class="eeat-item">
        <div class="area">${esc(e.area)}</div>
        <div class="desc">${esc(e.recommendation)}</div>
        <div class="tags">
          <span class="tag">${aeoLabel(lang, 'impactLabel')}: ${esc(e.impact)}</span>
          <span class="tag">${aeoLabel(lang, 'effortLabel')}: ${esc(e.effort)}</span>
        </div>
      </div>`)
    .join('');
  return `
    <div class="page">
      ${pageHeader(input.config, lang, pageNum)}
      <h1>${aeoLabel(lang, 'eeatRecs')}</h1>
      <p class="lead">${aeoLabel(lang, 'eeatRecsDesc')}</p>
      <div class="eeat-grid">${items}</div>
      ${pageFooter(input.config, lang, pageNum)}
    </div>`;
}

function renderMethodology(input: AeoReportInput, lang: Lang, pageNum: number): string {
  const { run } = input;
  const sampleCallsByProvider = new Map<string, typeof run.calls[number]>();
  for (const c of run.calls) if (!sampleCallsByProvider.has(c.provider)) sampleCallsByProvider.set(c.provider, c);
  const samples = [...sampleCallsByProvider.entries()]
    .map(([p, c]) => `
      <div class="artifact-card">
        <div class="head">${aeoLabel(lang, 'sampleCitation')} ${aeoLabel(lang, 'fromProvider')} ${esc(p)} (${esc(c.model)})</div>
        <div class="desc">"${esc(c.promptText.slice(0, 90))}${c.promptText.length > 90 ? '…' : ''}"</div>
        <pre class="code">${esc(c.response.text.slice(0, 800))}${c.response.text.length > 800 ? '…' : ''}</pre>
      </div>`)
    .join('');
  return `
    <div class="page">
      ${pageHeader(input.config, lang, pageNum)}
      <h1>${aeoLabel(lang, 'methodology')}</h1>
      <p class="lead">${aeoLabel(lang, 'methodologyDesc')}</p>
      <div class="kpi-grid">
        <div class="kpi"><div class="label">${aeoLabel(lang, 'prompts')}</div><div class="value">${run.prompts.length}</div></div>
        <div class="kpi"><div class="label">${aeoLabel(lang, 'samples')}</div><div class="value">${run.samplesPerProvider}</div></div>
        <div class="kpi"><div class="label">${aeoLabel(lang, 'apiCalls')}</div><div class="value">${run.calls.length}</div></div>
        <div class="kpi"><div class="label">${aeoLabel(lang, 'cost')}</div><div class="value">$${run.totalCostUsd.toFixed(2)}</div></div>
      </div>
      <h3>${aeoLabel(lang, 'appendixCitations')}</h3>
      ${samples}
      ${pageFooter(input.config, lang, pageNum)}
    </div>`;
}

function pageHeader(config: BrandConfig, lang: Lang, _num: number): string {
  return `
    <div class="header">
      <div class="logo">SEONA · AEO</div>
      <div class="meta">${esc(config.brandName)} · ${esc(config.domain)}</div>
    </div>`;
}

function pageFooter(_config: BrandConfig, lang: Lang, num: number): string {
  return `
    <div class="footer">
      <div>${aeoLabel(lang, 'confidential')}</div>
      <div>${aeoLabel(lang, 'page')} ${num}</div>
    </div>`;
}

export function buildAeoReportHtml(input: AeoReportInput): string {
  const lang: Lang = input.language ?? input.config.language ?? 'de';
  const accent = input.config.accentColor || '#e05a33';
  let page = 0;
  const sections: string[] = [];
  sections.push(renderCover(input, lang));
  page += 1; sections.push(renderSummary(input, lang));
  page += 1; sections.push(renderPromptCoverage(input, lang, page));
  page += 1; sections.push(renderActionPlan(input, lang, page));
  if (input.competitorGaps.length > 0) { page += 1; sections.push(renderCompetitorGaps(input, lang, page)); }
  page += 1; sections.push(renderArtifacts(input, lang, page));
  page += 2; sections.push(renderEeat(input, lang, page));
  page += 1; sections.push(renderMethodology(input, lang, page));

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${aeoLabel(lang, 'aeoReport')} — ${esc(input.config.brandName)}</title>
  <style>${styles(accent)}</style>
</head>
<body>
${sections.join('\n')}
</body>
</html>`;
  return html;
}

export async function renderAeoPdf(input: AeoReportInput, html?: string): Promise<Buffer> {
  const finalHtml = html ?? buildAeoReportHtml(input);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(finalHtml, { waitUntil: 'networkidle' });
    const buf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    await context.close();
    return Buffer.from(buf);
  } finally {
    await browser.close();
  }
}
