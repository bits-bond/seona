import type { PdfColorPalette } from './types';

export function getPdfStyles(p: PdfColorPalette): string {
  return `
  @page {
    size: A4;
    margin: 0;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background: ${p.bg};
    color: ${p.text};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ═══════════════════════════════════════════
     SLIDE SYSTEM
     ═══════════════════════════════════════════ */

  .slide {
    width: 210mm;
    height: 297mm;
    padding: 18mm 15mm 16mm 15mm;
    page-break-after: always;
    page-break-inside: avoid;
    display: grid;
    grid-template-rows: auto 1fr auto;
    position: relative;
    overflow: hidden;
    background: ${p.bg};
  }
  .slide:last-child {
    page-break-after: auto;
  }

  /* Slide header bar */
  .slide-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 2px solid ${p.accent};
    margin-bottom: 14px;
    flex-shrink: 0;
  }
  .slide-header-title {
    font-size: 14pt;
    font-weight: 700;
    color: ${p.text};
  }
  .slide-header-brand {
    font-size: 10pt;
    font-weight: 800;
    letter-spacing: 2px;
    color: ${p.accent};
  }

  /* Slide body — content flows from top, clean whitespace at bottom */
  .slide-body {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* Slide footer bar */
  .slide-footer {
    padding-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8pt;
    color: ${p.textDimmed};
    border-top: 1px solid ${p.border};
  }

  /* ── Layout variants ── */

  /* Cover slide: centered, gradient, no header/footer — override grid to flex */
  .slide-cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, ${p.bgGradient1} 0%, ${p.bgGradient2} 50%, ${p.bgGradient1} 100%);
  }
  .slide-cover::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 50% 50%, rgba(224, 90, 51, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }

  /* Two-column body — content starts from top */
  .slide-body.two-col,
  .slide-body.two-col-60-40 {
    justify-content: flex-start;
    padding-top: 16px;
    overflow: visible;
  }
  .grid-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
  }
  .grid-two-col-60-40 {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 24px;
    align-items: start;
  }

  /* ═══════════════════════════════════════════
     COVER ELEMENTS
     ═══════════════════════════════════════════ */

  .cover-logo {
    font-size: 48pt;
    font-weight: 800;
    letter-spacing: 8px;
    color: ${p.accent};
    margin-bottom: 12px;
    position: relative;
  }
  .cover-subtitle {
    font-size: 14pt;
    color: ${p.textMuted};
    margin-bottom: 40px;
    font-weight: 300;
    position: relative;
  }
  .cover-domain {
    font-size: 20pt;
    font-weight: 600;
    color: ${p.text};
    margin-bottom: 10px;
    position: relative;
  }
  .cover-date {
    font-size: 11pt;
    color: ${p.textMuted};
    position: relative;
  }
  .cover-score {
    margin-top: 40px;
    position: relative;
  }

  /* ═══════════════════════════════════════════
     TYPOGRAPHY
     ═══════════════════════════════════════════ */

  h1 {
    font-size: 18pt;
    font-weight: 700;
    color: ${p.text};
    margin-bottom: 12px;
  }
  h2 {
    font-size: 14pt;
    font-weight: 600;
    color: ${p.text};
    margin-bottom: 10px;
    margin-top: 16px;
  }
  h3 {
    font-size: 12pt;
    font-weight: 600;
    color: ${p.textSecondary};
    margin-bottom: 6px;
    margin-top: 10px;
  }
  p {
    margin-bottom: 6px;
  }

  /* ═══════════════════════════════════════════
     TABLES
     ═══════════════════════════════════════════ */

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 9pt;
  }
  thead {
    background: ${p.tableHeaderBg};
  }
  th {
    text-align: left;
    padding: 8px 10px;
    font-weight: 600;
    color: ${p.text};
    border-bottom: 2px solid ${p.border};
  }
  td {
    padding: 6px 10px;
    border-bottom: 1px solid ${p.border};
    color: ${p.textSecondary};
  }
  tr:nth-child(even) td {
    background: ${p.tableRowAltBg};
  }

  /* ═══════════════════════════════════════════
     SEVERITY BADGES
     ═══════════════════════════════════════════ */

  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-critical {
    background: rgba(193, 18, 31, 0.2);
    color: #ff4455;
    border: 1px solid rgba(193, 18, 31, 0.4);
  }
  .badge-high {
    background: rgba(204, 119, 34, 0.2);
    color: #ffaa44;
    border: 1px solid rgba(204, 119, 34, 0.4);
  }
  .badge-medium {
    background: rgba(212, 168, 67, 0.2);
    color: #eebb55;
    border: 1px solid rgba(212, 168, 67, 0.4);
  }
  .badge-low {
    background: rgba(42, 157, 90, 0.2);
    color: #44cc77;
    border: 1px solid rgba(42, 157, 90, 0.4);
  }

  /* Category badge (small pill) */
  .badge-cat {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 10px;
    font-size: 7pt;
    font-weight: 500;
    background: ${p.tableHeaderBg};
    color: ${p.textMuted};
  }

  /* ═══════════════════════════════════════════
     ISSUE CARD V2 (structured slide layout)
     ═══════════════════════════════════════════ */

  .issue-card-v2 {
    background: ${p.cardBg};
    border: 1px solid ${p.border};
    border-left: 4px solid ${p.border};
    border-radius: 8px;
    padding: 16px 18px;
    margin-bottom: 14px;
  }
  .issue-card-v2.sev-critical { border-left-color: #c1121f; }
  .issue-card-v2.sev-high { border-left-color: #cc7722; }
  .issue-card-v2.sev-medium { border-left-color: #d4a843; }
  .issue-card-v2.sev-low { border-left-color: #2a9d5a; }

  .issue-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .issue-card-num {
    font-size: 8pt;
    color: ${p.textDimmed};
    margin-left: auto;
  }
  .issue-card-title {
    font-size: 11pt;
    font-weight: 700;
    color: ${p.text};
    margin-bottom: 4px;
    line-height: 1.3;
  }
  .issue-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }
  .meta-pill {
    font-size: 7.5pt;
    padding: 2px 8px;
    border-radius: 4px;
    background: ${p.tableHeaderBg};
    color: ${p.textMuted};
  }
  .meta-pill strong {
    color: ${p.textSecondary};
    font-weight: 600;
  }
  .issue-card-desc {
    font-size: 9pt;
    color: ${p.textSecondary};
    line-height: 1.5;
    overflow: hidden;
    margin-bottom: 8px;
  }
  /* When card has detail boxes, limit description to ~3 lines */
  .issue-card-v2.has-details .issue-card-desc {
    max-height: 4.5em;
  }
  .issue-card-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .issue-card-impact {
    background: rgba(233, 196, 106, 0.1);
    border: 1px solid rgba(233, 196, 106, 0.25);
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 8pt;
    color: ${p.impactColor};
    line-height: 1.4;
    max-height: 5em;
    overflow: hidden;
  }
  .issue-card-impact-label,
  .issue-card-rec-label {
    font-weight: 700;
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
    display: block;
  }
  .issue-card-rec {
    background: ${p.recommendationBg};
    border: 1px solid rgba(42, 157, 143, 0.2);
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 8pt;
    color: ${p.recommendationAccent};
    line-height: 1.4;
    max-height: 5em;
    overflow: hidden;
  }

  /* ═══════════════════════════════════════════
     CATEGORY CARD V2 (with progress bar)
     ═══════════════════════════════════════════ */

  .cat-card-v2 {
    background: ${p.cardBg};
    border: 1px solid ${p.border};
    border-radius: 8px;
    padding: 14px 16px;
  }
  .cat-card-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .cat-card-icon {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cat-card-name {
    font-size: 9pt;
    font-weight: 600;
    color: ${p.text};
    flex: 1;
  }
  .cat-card-score {
    font-size: 16pt;
    font-weight: 800;
    color: ${p.text};
    line-height: 1;
  }
  .cat-card-score-sub {
    font-size: 9pt;
    font-weight: 400;
    color: ${p.textMuted};
  }
  .cat-card-bar {
    margin-top: 4px;
    margin-bottom: 4px;
  }
  .cat-card-weight {
    font-size: 8pt;
    color: ${p.textDimmed};
    text-align: right;
  }

  /* Category card grid */
  .cat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin: 10px 0;
  }

  /* ═══════════════════════════════════════════
     QUICK WINS
     ═══════════════════════════════════════════ */

  .quick-win {
    background: ${p.recommendationBg};
    border: 1px solid rgba(42, 157, 143, 0.2);
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 10px;
  }
  .quick-win h3 {
    color: ${p.recommendationAccent};
    margin-top: 0;
    font-size: 10pt;
  }
  .quick-win p {
    font-size: 9pt;
    color: ${p.textSecondary};
  }

  /* ═══════════════════════════════════════════
     METRICS & STATS
     ═══════════════════════════════════════════ */

  .metric-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid ${p.border};
    font-size: 10pt;
  }
  .metric-label {
    color: ${p.textMuted};
    font-weight: 500;
  }
  .metric-value {
    color: ${p.text};
    font-weight: 600;
    margin-left: auto;
  }

  .severity-dots {
    display: flex;
    gap: 12px;
    margin-top: 10px;
    font-size: 9pt;
  }
  .severity-dot {
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${p.textSecondary};
  }
  .severity-dot .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }

  /* ═══════════════════════════════════════════
     NEXT STEPS
     ═══════════════════════════════════════════ */

  .step-card {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    margin-bottom: 18px;
  }
  .step-num {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: ${p.accent};
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14pt;
    flex-shrink: 0;
  }
  .step-text {
    flex: 1;
  }
  .step-text strong {
    display: block;
    font-size: 11pt;
    color: ${p.text};
    margin-bottom: 4px;
  }
  .step-text span {
    font-size: 9.5pt;
    color: ${p.textSecondary};
    line-height: 1.5;
  }

  /* CTA card */
  .cta-card {
    margin-top: 32px;
    padding: 24px 20px;
    background: ${p.cardBg};
    border: 1px solid ${p.border};
    border-radius: 12px;
    text-align: center;
  }
  .cta-card h2 {
    margin-top: 0;
    font-size: 14pt;
  }
  .cta-card p {
    color: ${p.textMuted};
    font-size: 10pt;
    margin-top: 6px;
  }
  .cta-brand {
    color: ${p.accent};
    font-weight: 600;
    font-size: 11pt;
    margin-top: 10px;
  }

  /* ═══════════════════════════════════════════
     TOC
     ═══════════════════════════════════════════ */

  .toc-item {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1px dotted ${p.border};
    font-size: 10pt;
  }
  .toc-item .toc-label {
    color: ${p.text};
  }
  .toc-item .toc-page {
    color: ${p.textMuted};
  }
  .toc-indent {
    padding-left: 20px;
  }

  /* ═══════════════════════════════════════════
     SCREENSHOTS
     ═══════════════════════════════════════════ */

  .screenshot-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin: 12px 0;
  }
  .screenshot-item img {
    width: 100%;
    border-radius: 8px;
    border: 1px solid ${p.border};
  }
  .screenshot-item .caption {
    font-size: 8pt;
    color: ${p.textMuted};
    margin-top: 4px;
    text-align: center;
  }

  /* ═══════════════════════════════════════════
     CHARTS
     ═══════════════════════════════════════════ */

  .chart-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 8px 0;
  }
  .charts-row {
    display: flex;
    gap: 24px;
    justify-content: center;
    flex-wrap: wrap;
    margin: 12px 0;
  }

  /* ═══════════════════════════════════════════
     MARKDOWN CONTENT (for appendix)
     ═══════════════════════════════════════════ */

  .markdown-content {
    font-size: 9pt;
    color: ${p.textSecondary};
    line-height: 1.6;
  }
  .markdown-content h1 { font-size: 14pt; color: ${p.text}; margin-top: 12px; }
  .markdown-content h2 { font-size: 12pt; color: ${p.text}; margin-top: 10px; }
  .markdown-content h3 { font-size: 10pt; color: ${p.text}; margin-top: 8px; }
  .markdown-content ul { padding-left: 18px; margin: 6px 0; }
  .markdown-content ol { padding-left: 18px; margin: 6px 0; }
  .markdown-content li { margin-bottom: 3px; }
  .markdown-content code {
    background: ${p.codeBg};
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 8pt;
    font-family: monospace;
  }
  .markdown-content pre {
    background: ${p.codeBg};
    padding: 10px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 6px 0;
  }
  .markdown-content blockquote {
    border-left: 3px solid ${p.accent};
    padding-left: 10px;
    color: ${p.textSecondary};
    margin: 6px 0;
  }
  .markdown-content table { font-size: 8pt; }
  .markdown-content a { color: ${p.link}; text-decoration: underline; }

  /* ═══════════════════════════════════════════
     SCORE DISPLAY
     ═══════════════════════════════════════════ */

  .score-label {
    font-size: 10pt;
    color: ${p.textMuted};
    text-align: center;
    margin-top: 4px;
  }

  /* Centered flex helper */
  .flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .flex-col-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
`;
}
