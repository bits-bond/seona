# Task: PDF Export with Language Support

## Objective
Build a professional PDF export system that generates two report variants (Executive Summary and Full Technical Report) from completed audit data. PDFs use a dark-theme A4 design with SEONA branding, static SVG charts, embedded screenshots, and page numbers. Add a `language` column to the audits table so audits can be generated in German or English — Claude CLI handles the translation via prompt injection; the PDF template uses a small label lookup for section headers and UI strings.

## Scope

### Create These Files
- `web/lib/pdf/types.ts` — TypeScript interfaces: `PdfType`, `PdfAuditData`, `PdfScreenshot`
- `web/lib/pdf/labels.ts` — DE/EN label lookup object for ~30 PDF strings (section headers, severity names, score labels). NOT a full i18n library — just a `Record<Language, Record<string, string>>` with a `label(lang, key)` function
- `web/lib/pdf/svg-charts.ts` — Static SVG string generators: `renderScoreGaugeSVG(score, size)`, `renderRadarChartSVG(categories, size)`, `renderBarChartSVG(categories, width, height)`. Must produce self-contained SVG with inline styles (no CSS variables — use resolved hex colors)
- `web/lib/pdf/styles.ts` — CSS string for PDF: `@page { size: A4 }`, dark theme (`background: #0a0a0f; color: #e8e8ed`), page breaks, tables, severity badges, cover page, typography
- `web/lib/pdf/screenshots.ts` — `loadScreenshots(domain)`: reads `output/{domain}/screenshots/*.png`, returns base64 data URIs with viewport/type metadata
- `web/lib/pdf/template-executive.ts` — `buildExecutiveHtml(data, lang)`: 5-page HTML (cover, scores+radar+top issues, quick wins, next steps+contact)
- `web/lib/pdf/template-full.ts` — `buildFullReportHtml(data, lang)`: 15-25 page HTML (cover, TOC, executive summary, 7 category sections, action plan, screenshots, appendix)
- `web/lib/pdf/renderer.ts` — Playwright PDF renderer. Cache browser via `globalThis` (HMR-safe). `generatePdf(data, type, lang)` returns `Buffer`. Uses `printBackground: true`, custom header/footer templates
- `web/app/api/audits/[id]/pdf/route.ts` — GET endpoint: `?type=executive|full&lang=de|en`. Fetches audit+categories+issues+project from DB, loads screenshots, generates PDF, returns binary with `Content-Disposition` filename

### Modify These Files
- `web/lib/db/schema.ts` — Add `language: varchar('language', { length: 5 }).notNull().default('en')` to `audits` table
- `web/types/index.ts` — Add `language: 'en' | 'de'` to `Audit` interface. Export `type Language = 'en' | 'de'`
- `web/app/api/audits/route.ts` — POST handler: accept `language` field in body, persist to DB
- `web/app/api/audits/[id]/route.ts` — PUT handler: accept `language` in update fields
- `web/app/api/audits/[id]/run/route.ts` — Read `audit.language` from DB, pass to `startAudit()` as 4th argument
- `web/lib/audit-engine/runner.ts` — Add `language: string = 'en'` as 4th param to `startAudit()`. When `language === 'de'`, append to prompt: `"Write the entire audit report and action plan in German (Deutsch). All findings, descriptions, recommendations must be in German. Keep technical terms (robots.txt, JSON-LD, CWV) in their original form."`
- `web/lib/audit-engine/parser.ts` — Add German entries to `CATEGORY_MAP`: `'Technische SEO' -> 'technical'`, `'Inhaltsqualität' -> 'content'`, `'On-Page-SEO' -> 'on_page'`, `'Schema / Strukturierte Daten' -> 'schema'`, `'Bilder' -> 'images'`, `'KI-Suchbereitschaft' -> 'ai_readiness'`. Add German severity headers: `'KRITISCH' -> 'critical'`, `'HOCH' -> 'high'`, `'MITTEL' -> 'medium'`, `'NIEDRIG' -> 'low'`
- `web/app/new-audit/page.tsx` — Add language `<select>` dropdown (EN/DE) between URL input and submit button. Add `const [language, setLanguage] = useState<'en' | 'de'>('en')`. Include `language` in POST body to `/api/audits`
- `web/app/projects/[id]/audits/[auditId]/page.tsx` — Add `PdfExportDropdown` component in `pageActions` prop of `AppShell`. Dropdown with two buttons: "Executive Summary" and "Full Technical Report". On click: fetch `/api/audits/${auditId}/pdf?type=...`, convert response to blob, trigger download via programmatic `<a>` click. Show spinner while generating

### Read for Patterns (do not modify)
- `web/components/ui/score-gauge.tsx` — ScoreGauge uses RadialBarChart with `innerRadius="70%" outerRadius="90%" startAngle={90} endAngle={-270}`. Colors: `--chart-poor` (red), `--chart-needs-work` (orange), `--chart-medium` (yellow), `--chart-good` (green). Replicate arc math in SVG
- `web/components/ui/chart-radar.tsx` — Radar uses PolarGrid + PolarAngleAxis with CHART_COLORS array. 7 axes for categories. Replicate polygon math in SVG
- `web/app/globals.css` — Chart color CSS variables (oklch). Resolve to hex for SVG: chart-1 `#e05a33`, chart-2 `#2a9d8f`, chart-3 `#264653`, chart-4 `#e9c46a`, chart-5 `#f4a261`, critical `#c1121f`, high `#cc7722`, medium `#d4a843`, low/good `#2a9d5a`, poor `#c1121f`
- `web/components/dashboard/audit-summary.tsx` — Layout reference for score display
- `web/components/layout/app-shell.tsx` — `pageActions` prop is already wired to `PageHeader` component

### Off-Limits (never touch)
- `skills/` — All skill files (other worker's domain)
- `agents/` — All agent files (other worker's domain)
- `seo/` — Orchestrator skill (other worker's domain)
- `scripts/` — Python scripts (other worker's domain)
- `web/components/ui/` — Existing UI components (read-only reference)
- `web/components/dashboard/` — Existing dashboard components
- `web/components/layout/` — Layout components (except reading AppShell for pattern)

## Context

### Audit Data Available from DB
```typescript
// GET /api/audits/[id] returns:
{
  id: string;
  projectId: string;
  status: 'completed';
  overallScore: number;        // 0-100
  businessType: string | null; // e.g., "B2B Cybersecurity"
  pagesCrawled: number | null;
  completedAt: Date;
  fullReportMd: string;        // Full markdown report
  actionPlanMd: string;        // Action plan markdown
  language: 'en' | 'de';       // NEW — you add this
  categories: AuditCategory[]; // 7 items
  issues: AuditIssue[];        // Ordered by orderIndex
}
```

### Category Types (7)
`technical`, `content`, `on_page`, `schema`, `performance`, `images`, `ai_readiness`

### Issue Severities (4)
`critical`, `high`, `medium`, `low`

### Screenshot File Pattern
Files in `output/{domain}/screenshots/`:
- `{page}_{device}_{type}.png` — e.g., `homepage_desktop_above-fold.png`, `join_mobile_full.png`
- `metrics.json` — Raw performance data

### HMR Pattern (MUST use for Playwright browser)
```typescript
const globalForPdf = globalThis as typeof globalThis & { __pdfBrowser?: Browser };
```

### Runner `startAudit` Current Signature
```typescript
export async function startAudit(auditId: string, url: string, baseApiUrl: string): Promise<void>
```
Change to: `startAudit(auditId, url, baseApiUrl, language = 'en')`

### How Runner Builds the Prompt (line ~145 in runner.ts)
```typescript
const prompt = `Run /seo-audit ${url}. Save all output files to output/${domain}/`;
```
Append language instruction when `language === 'de'`.

### PROJECT_ROOT
```typescript
const PROJECT_ROOT = path.resolve(process.cwd(), '..');
```
Screenshots are at `PROJECT_ROOT/output/{domain}/screenshots/`

## Acceptance Criteria
- [ ] `language` column exists in DB, defaults to `'en'`, existing audits unaffected
- [ ] Language selector (EN/DE) visible in new-audit form, value persisted to DB
- [ ] German audits produce German analysis text (via Claude CLI prompt injection)
- [ ] Parser correctly extracts categories and severities from German audit output
- [ ] GET `/api/audits/{id}/pdf?type=executive` returns a valid PDF binary
- [ ] GET `/api/audits/{id}/pdf?type=full&lang=de` returns German-labeled PDF
- [ ] Executive PDF is 2-5 pages with cover, scores, top issues, quick wins, next steps
- [ ] Full PDF is 15-25 pages with cover, TOC, 7 category sections, action plan, screenshots, appendix
- [ ] PDFs have dark theme background (renders correctly with `printBackground: true`)
- [ ] SVG charts display correctly in PDF (score gauge arc, radar polygon, bar chart)
- [ ] Screenshots embedded as base64 (no broken images)
- [ ] Page numbers in footer, "SEONA" in header
- [ ] Export dropdown visible on audit detail page when status is `completed`
- [ ] Download triggers correctly with descriptive filename: `SEONA_Executive_{domain}_{date}_{LANG}.pdf`
- [ ] No TypeScript errors in modified or new files
- [ ] Existing audit functionality unchanged (create, run, view)

## Technical Guidance
- Playwright is already available in the project (Python venv). Install it in `web/` too: add `playwright` to devDependencies, run `npx playwright install chromium`
- For SVG score gauge: use `<circle>` with `stroke-dasharray` and `stroke-dashoffset` to create the arc. Calculate: `circumference = 2 * PI * radius`, `dashoffset = circumference * (1 - score/100)`, rotate -90deg for top start
- For SVG radar: 7 axes at `angle = (2 * PI * i) / 7`. Polygon vertices: `x = cx + (score/100) * radius * cos(angle - PI/2)`, `y = cy + (score/100) * radius * sin(angle - PI/2)`. Labels at outer edge
- For SVG bars: horizontal bars, full width = max score (100), bar width proportional to score
- CSS `page-break-inside: avoid` on tables and issue cards. `page-break-before: always` on each category section heading
- `@page` margins: `20mm top, 15mm sides, 25mm bottom` (room for footer)
- Playwright `page.pdf()` options: `format: 'A4'`, `printBackground: true`, `displayHeaderFooter: true` with custom headerTemplate/footerTemplate
- Label lookup example: `{ en: { executiveSummary: 'Executive Summary', ... }, de: { executiveSummary: 'Zusammenfassung', ... } }`

## Dependencies
- **Requires output from**: none (standalone)
- **Provides to**: none

## Completion Signal
When **all acceptance criteria are met**, output:
`<promise>PDF_EXPORT_COMPLETE</promise>`

If blocked and unable to continue, write details to `BLOCKERS.md` then output:
`<promise>PDF_EXPORT_BLOCKED</promise>`
