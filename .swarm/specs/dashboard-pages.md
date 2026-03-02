# Task: Dashboard Pages & Page Components

## Objective
Build all page-level components for the SEO dashboard: the main dashboard overview, projects list, individual project detail, audit detail with per-category breakdowns, and the new audit page. These pages compose the UI wrapper components (Worker 2) within the layout system (Worker 3) and read data from the API (Worker 4).

## Scope

### Create These Files

#### Pages
- `web/app/page.tsx` — Dashboard overview: overall stats, recent audits, score distribution chart
- `web/app/projects/page.tsx` — Projects list with search, sort, and grid/list toggle
- `web/app/projects/[id]/page.tsx` — Project detail: audit history, score trend, latest audit summary
- `web/app/projects/[id]/audits/[auditId]/page.tsx` — Full audit detail: scores, categories, issues, reports
- `web/app/new-audit/page.tsx` — New audit form: URL input, project selection or creation

#### Dashboard Components
- `web/components/dashboard/overview-cards.tsx` — Grid of StatCards: total projects, avg score, total audits, latest audit date
- `web/components/dashboard/recent-audits-table.tsx` — Table of 5 most recent audits across all projects
- `web/components/dashboard/score-distribution.tsx` — BarChart showing how many projects fall in each score range
- `web/components/dashboard/category-averages.tsx` — RadarChart of average category scores across all projects

#### Project Detail Components
- `web/components/dashboard/project-header.tsx` — Project name, URL link, last audit score gauge, action buttons
- `web/components/dashboard/audit-history-table.tsx` — Table of all audits for a project with date, score, status
- `web/components/dashboard/score-trend-chart.tsx` — AreaChart showing score over time for a project

#### Audit Detail Components
- `web/components/dashboard/audit-summary.tsx` — Executive summary: score gauge, business type, pages crawled, date
- `web/components/dashboard/category-cards.tsx` — Grid of cards for each of the 7 SEO categories with score and weight
- `web/components/dashboard/category-breakdown.tsx` — Expandable per-category detail with findings
- `web/components/dashboard/issues-table.tsx` — Sortable/filterable table of all issues with severity badges
- `web/components/dashboard/report-viewer.tsx` — Tabbed view: Full Report (markdown) | Action Plan (markdown)
- `web/components/dashboard/index.ts` — Barrel export

### Read for Patterns (do not modify)
- `web/types/index.ts` — All type definitions (`Project`, `Audit`, `AuditCategory`, `AuditIssue`, `CATEGORY_CONFIG`, `SEVERITY_CONFIG`)
- `web/lib/utils.ts` — `cn()`, `formatScore()`, `formatDate()`, `getScoreColor()`, `getScoreLabel()`
- `web/components/ui/index.ts` — All UI wrapper components (ScoreGauge, StatCard, ChartArea, etc.)
- `web/components/layout/index.ts` — AppShell, PageHeader
- `output/watchmen.io/FULL-AUDIT-REPORT.md` — Reference for how audit data looks
- `output/watchmen.io/ACTION-PLAN.md` — Reference for action plan structure

### Off-Limits (never touch)
- `web/components/ui/*` (Worker 2)
- `web/components/layout/*` (Worker 3)
- `web/lib/db/*`, `web/app/api/*` (Worker 4)
- `web/lib/audit-engine/*`, `web/components/audit/*` (Worker 6)
- All existing claude-seo files

## Context

### Page Layout Pattern
Every page uses the AppShell from Worker 3:
```tsx
"use client";

import { AppShell } from '@/components/layout';

export default function DashboardPage() {
  return (
    <AppShell
      breadcrumbs={[{ label: 'Dashboard' }]}
      pageTitle="SEO Dashboard"
      pageDescription="Overview of all your SEO projects and audits"
    >
      {/* Page content here */}
    </AppShell>
  );
}
```

### Data Fetching Pattern
Pages fetch data from the API routes (Worker 4). Use client-side fetching with `useSWR` or `useEffect + fetch`:
```tsx
"use client";

import useSWR from 'swr';
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useSWR('/api/projects', fetcher);
  // ...
}
```
Include `swr` as a dependency (Worker 1 should add it to package.json).

### Dashboard Overview Page (`/`)
Layout: 4-column responsive grid
```
Row 1: [StatCard: Projects] [StatCard: Avg Score] [StatCard: Audits] [StatCard: Latest]
Row 2: [ScoreDistribution chart (col-span-2)] [CategoryAverages radar (col-span-2)]
Row 3: [RecentAuditsTable (full width)]
```

### Projects Page (`/projects`)
- Search bar + sort dropdown (by name, score, date) + grid/list toggle
- Grid view: Cards with project name, URL, score gauge, last audit date, audit count
- List view: Table with same data
- "New Project" button in PageHeader actions
- Empty state if no projects

### Project Detail Page (`/projects/[id]`)
```
Row 1: [ProjectHeader with score gauge, URL, action buttons]
Row 2: [ScoreTrendChart (col-span-2)] [Latest audit category breakdown (col-span-1)]
Row 3: [AuditHistoryTable (full width)]
```
Action buttons: "Run New Audit" → navigates to `/new-audit?projectId=xxx`

### Audit Detail Page (`/projects/[id]/audits/[auditId]`)
```
Row 1: [AuditSummary — large score gauge, business type, pages crawled, date, status]
Row 2: [CategoryCards — 7 cards in responsive grid, each showing category name, score, weight]
Row 3: [ChartBar of category scores (col-span-1)] [ChartRadar of category scores (col-span-1)]
Row 4: [IssuesTable (full width) — filterable by severity and category]
Row 5: [ReportViewer (full width) — tabs for Full Report / Action Plan rendered as markdown]
```

### New Audit Page (`/new-audit`)
- If `?projectId=xxx` in URL, pre-select that project
- Form fields:
  1. Project selection (dropdown of existing projects) OR "Create new project" toggle
  2. If new project: Name + URL inputs
  3. If existing project: URL is pre-filled and readonly
  4. "Start Audit" button
- On submit: POST to `/api/audits` with projectId, then navigate to audit detail page
- Shows loading/progress state (connects to Worker 6's audit progress component)

### Grid System
Use Tailwind responsive grid:
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4` for stat cards
- `grid grid-cols-1 lg:grid-cols-3 gap-6` for charts + sidebar
- `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4` for category cards

## Acceptance Criteria
- [ ] Dashboard page (`/`) renders 4 stat cards, 2 charts, and recent audits table
- [ ] Projects page shows grid/list toggle, search, and sort functionality
- [ ] Project detail page shows score trend chart, audit history, and latest category breakdown
- [ ] Audit detail page shows score gauge, 7 category cards, charts, issues table, and markdown reports
- [ ] New audit page has project selector, URL input, and submit button
- [ ] All pages use AppShell with correct breadcrumbs
- [ ] All pages handle loading states with LoadingSkeleton components
- [ ] All pages handle empty states with EmptyState component
- [ ] All pages handle error states gracefully (show error message, retry button)
- [ ] Grid layout is responsive: collapses to single column on mobile
- [ ] Clicking a project in the sidebar navigates to its detail page
- [ ] Clicking an audit in any table navigates to its detail page
- [ ] All data fetching uses the API routes (no direct DB access from pages)
- [ ] No TypeScript errors
- [ ] Uses `lucide-react` icons throughout

## Technical Guidance
- All page files must be `"use client"` since they use hooks for data fetching
- Use `swr` for data fetching with proper loading/error states: `const { data, isLoading, error, mutate } = useSWR(...)`
- For the audit detail page, the issues table should be filterable by severity (chip toggle) and category (dropdown)
- The ReportViewer component should use the MarkdownRenderer from Worker 2's UI components
- Category cards should use CATEGORY_CONFIG from types for labels, colors, and icons
- Score trend chart X-axis should show dates, Y-axis 0-100
- For responsive grids, use the `cn()` utility with conditional classes

## Dependencies
- **Requires output from**: `scaffold-foundation` (types, utils), `ui-components` (all chart/display wrappers), `layout-navigation` (AppShell, PageHeader)
- **Provides to**: none (this is the final UI layer)

## Completion Signal
When **all acceptance criteria are met**, output:
`<promise>DASHBOARD_PAGES_COMPLETE</promise>`

If blocked and unable to continue, write details to `BLOCKERS.md` then output:
`<promise>DASHBOARD_PAGES_BLOCKED</promise>`
