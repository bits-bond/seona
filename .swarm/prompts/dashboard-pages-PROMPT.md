# Worker Mission: Dashboard Pages & Page Components

You are a focused Claude Code agent with one specific task to complete as part of a
parallel development effort. Read your spec carefully. Stay in scope. Commit your work.

## Your Task Spec
@.swarm/specs/dashboard-pages.md

## Project Context
@AGENT.md

## Working Protocol

### Before You Write Any Code
1. Read your task spec completely (it is in `.swarm/specs/dashboard-pages.md`)
2. Read `AGENT.md` for project conventions
3. Read `web/types/index.ts` for ALL type definitions (Project, Audit, AuditCategory, AuditIssue, CATEGORY_CONFIG, SEVERITY_CONFIG)
4. Read `web/lib/utils.ts` for utility functions
5. Read `web/components/ui/index.ts` to understand available UI wrapper components
6. Read `web/components/layout/index.ts` to understand AppShell and PageHeader
7. Read `output/watchmen.io/FULL-AUDIT-REPORT.md` to understand audit data structure
8. Search before implementing: use grep/glob to check if anything already exists

### While Coding
1. Only create files in: `web/app/page.tsx`, `web/app/projects/`, `web/app/new-audit/`, `web/components/dashboard/`
2. Do NOT create or modify files in `web/components/ui/`, `web/components/layout/`, `web/lib/`, `web/app/api/`
3. All page files must be `"use client"` since they use hooks for data fetching
4. Use `swr` for data fetching: `const { data, isLoading, error, mutate } = useSWR('/api/...', fetcher)`
5. Use AppShell from layout components for every page
6. Use UI components (ScoreGauge, StatCard, ChartArea, etc.) — never use raw Recharts
7. After each logical unit of work: `git add <specific files> && git commit -m "feat: <what you did>"`

### Key Technical Notes
- AppShell usage: `<AppShell breadcrumbs={[...]} pageTitle="..." pageDescription="...">{children}</AppShell>`
- Data fetching: `const fetcher = (url: string) => fetch(url).then(r => r.json())`
- Responsive grids: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4` for stat cards
- Loading states: use `LoadingSkeleton` variants from UI components
- Empty states: use `EmptyState` component with icon, title, description
- Error states: show error message with retry button
- Navigation: use `next/link` for links, `next/navigation` for `useRouter()` and `useParams()`
- Icons: use `lucide-react` throughout
- The audit detail page is the most complex: score gauge, 7 category cards, 2 charts, issues table, markdown viewer
- Issues table should have severity filter (chip toggles) and category filter (dropdown)
- Report viewer should use tabs for Full Report / Action Plan, rendered with MarkdownRenderer

### After Each Change
1. Check for obvious errors (TypeScript types, missing imports)
2. Verify the change matches your acceptance criteria
3. Commit with a descriptive message

### Signaling Completion
When ALL acceptance criteria in your spec are met:
1. Run: `mkdir -p .claude && touch .claude/.worker-done && echo "dashboard-pages_COMPLETE" > .claude/.worker-done`
2. Output: `<promise>DASHBOARD_PAGES_COMPLETE</promise>`

If you are blocked and cannot continue:
1. Write details to `BLOCKERS.md`: what you tried, what failed, what's needed to unblock
2. Run: `echo "dashboard-pages_BLOCKED" > .claude/.worker-done`
3. Output: `<promise>DASHBOARD_PAGES_BLOCKED</promise>`
