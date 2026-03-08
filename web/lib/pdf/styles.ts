export const PDF_STYLES = `
  @page {
    size: A4;
    margin: 20mm 15mm 25mm 15mm;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background: #0a0a0f;
    color: #e8e8ed;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Cover page */
  .cover-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    page-break-after: always;
    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
    position: relative;
    overflow: hidden;
  }

  .cover-page::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 50% 50%, rgba(224, 90, 51, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }

  .cover-logo {
    font-size: 42pt;
    font-weight: 800;
    letter-spacing: 8px;
    color: #e05a33;
    margin-bottom: 16px;
  }

  .cover-subtitle {
    font-size: 14pt;
    color: #8888a0;
    margin-bottom: 48px;
    font-weight: 300;
  }

  .cover-domain {
    font-size: 20pt;
    font-weight: 600;
    color: #e8e8ed;
    margin-bottom: 12px;
  }

  .cover-date {
    font-size: 11pt;
    color: #8888a0;
  }

  .cover-score {
    margin-top: 48px;
  }

  /* Section headings */
  h1 {
    font-size: 20pt;
    font-weight: 700;
    color: #e8e8ed;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e05a33;
  }

  h2 {
    font-size: 16pt;
    font-weight: 600;
    color: #e8e8ed;
    margin-bottom: 12px;
    margin-top: 24px;
  }

  h3 {
    font-size: 13pt;
    font-weight: 600;
    color: #c8c8d0;
    margin-bottom: 8px;
    margin-top: 16px;
  }

  p {
    margin-bottom: 8px;
  }

  /* Section breaks */
  .section {
    page-break-before: always;
    padding-top: 8px;
  }

  .section:first-of-type {
    page-break-before: auto;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }

  thead {
    background: #1a1a2e;
  }

  th {
    text-align: left;
    padding: 10px 12px;
    font-weight: 600;
    color: #e8e8ed;
    border-bottom: 2px solid #2a2a3e;
  }

  td {
    padding: 8px 12px;
    border-bottom: 1px solid #1a1a2e;
    color: #c8c8d0;
  }

  tr:nth-child(even) td {
    background: rgba(26, 26, 46, 0.5);
  }

  /* Severity badges */
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 9pt;
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

  /* Issue cards */
  .issue-card {
    background: #12121a;
    border: 1px solid #2a2a3e;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    page-break-inside: avoid;
  }

  .issue-card h3 {
    margin-top: 0;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .issue-card p {
    font-size: 10pt;
    color: #a8a8b8;
  }

  .issue-card .impact {
    color: #e9c46a;
    font-weight: 500;
    margin-top: 8px;
  }

  .issue-card .recommendation {
    color: #2a9d8f;
    margin-top: 8px;
    padding: 8px 12px;
    background: rgba(42, 157, 143, 0.08);
    border-radius: 6px;
    border-left: 3px solid #2a9d8f;
  }

  /* Score display */
  .score-display {
    text-align: center;
    margin: 20px 0;
  }

  .score-number {
    font-size: 48pt;
    font-weight: 800;
    line-height: 1;
  }

  .score-label {
    font-size: 11pt;
    color: #8888a0;
    margin-top: 4px;
  }

  /* Charts container */
  .chart-container {
    display: flex;
    justify-content: center;
    margin: 20px 0;
    page-break-inside: avoid;
  }

  .charts-row {
    display: flex;
    gap: 32px;
    justify-content: center;
    flex-wrap: wrap;
    margin: 20px 0;
  }

  /* Category grid */
  .category-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin: 16px 0;
  }

  .category-card {
    background: #12121a;
    border: 1px solid #2a2a3e;
    border-radius: 8px;
    padding: 12px 16px;
    page-break-inside: avoid;
  }

  .category-card .cat-name {
    font-size: 10pt;
    color: #8888a0;
    margin-bottom: 4px;
  }

  .category-card .cat-score {
    font-size: 18pt;
    font-weight: 700;
  }

  .category-card .cat-weight {
    font-size: 9pt;
    color: #6868a0;
  }

  /* Screenshot grid */
  .screenshot-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin: 16px 0;
  }

  .screenshot-item {
    page-break-inside: avoid;
  }

  .screenshot-item img {
    width: 100%;
    border-radius: 8px;
    border: 1px solid #2a2a3e;
  }

  .screenshot-item .caption {
    font-size: 9pt;
    color: #8888a0;
    margin-top: 4px;
    text-align: center;
  }

  /* TOC */
  .toc {
    page-break-after: always;
  }

  .toc-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px dotted #2a2a3e;
    font-size: 11pt;
  }

  .toc-item .toc-label {
    color: #e8e8ed;
  }

  .toc-item .toc-page {
    color: #8888a0;
  }

  /* Quick wins */
  .quick-win {
    background: rgba(42, 157, 143, 0.08);
    border: 1px solid rgba(42, 157, 143, 0.2);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 10px;
    page-break-inside: avoid;
  }

  .quick-win h3 {
    color: #2a9d8f;
    margin-top: 0;
    font-size: 11pt;
  }

  .quick-win p {
    font-size: 10pt;
    color: #a8a8b8;
  }

  /* Next steps */
  .next-steps ol {
    padding-left: 24px;
    color: #c8c8d0;
  }

  .next-steps li {
    margin-bottom: 12px;
    font-size: 10pt;
  }

  /* Markdown content in report */
  .markdown-content {
    font-size: 10pt;
    color: #c8c8d0;
    line-height: 1.7;
  }

  .markdown-content h1 { font-size: 16pt; }
  .markdown-content h2 { font-size: 14pt; }
  .markdown-content h3 { font-size: 12pt; }
  .markdown-content ul { padding-left: 20px; margin: 8px 0; }
  .markdown-content ol { padding-left: 20px; margin: 8px 0; }
  .markdown-content li { margin-bottom: 4px; }
  .markdown-content code {
    background: #1a1a2e;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 9pt;
    font-family: monospace;
  }
  .markdown-content pre {
    background: #1a1a2e;
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;
  }
  .markdown-content blockquote {
    border-left: 3px solid #e05a33;
    padding-left: 12px;
    color: #a8a8b8;
    margin: 8px 0;
  }
  .markdown-content table { font-size: 9pt; }
  .markdown-content a { color: #4da6ff; text-decoration: underline; }

  /* Footer placeholder (rendered by Playwright) */
  .page-footer {
    font-size: 8pt;
    color: #6868a0;
    text-align: center;
  }
`;
