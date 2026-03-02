# Swarm Mission: SEO Dashboard Web App

**Created:** 2026-03-02
**Branch:** main
**Workers:** 6

## Mission Description

Build a fully functional end-to-end web application using Next.js 15, HeroUI v3, and Claude Code CLI integration. Users input a URL, the app spawns Claude Code CLI to run SEO analysis (replicating the existing `/seo-audit` workflow), and results are displayed in a professional dashboard per project. Results are stored in PostgreSQL (Docker). Beautiful visualization with Recharts, floating sidebar, top navbar, professional grid design. Wrapper components for HeroUI and Recharts ensure consistent theming.

## Key Architecture Decisions

- **HeroUI v3** (beta): Tailwind CSS v4, compound component API (`Card.Header` not `CardHeader`), no HeroUIProvider needed, `@import "@heroui/styles"` in globals.css
- **Audit Engine**: Spawns `claude` CLI via `child_process.spawn()` — NO Claude Agent SDK, NO API key needed, runs on user's existing Claude Code subscription
- **Database**: PostgreSQL via Docker Compose, Drizzle ORM for type-safe queries
- **Charts**: Recharts wrapped in HeroUI-themed components
- **All new files in `web/` subdirectory** — existing claude-seo skill files are off-limits

## Task Breakdown

| # | Task Slug | Objective | Primary Files | Merge Order |
|---|-----------|-----------|---------------|-------------|
| 1 | `scaffold-foundation` | Next.js 15 scaffolding, HeroUI v3 + Tailwind v4 config, root layout, shared types, utilities | `web/` root config files, `web/app/layout.tsx`, `web/app/globals.css`, `web/types/`, `web/lib/utils.ts` | First |
| 2 | `ui-components` | Wrapper components for Recharts and HeroUI: ScoreGauge, StatCard, DataTable, ChartArea, ChartBar, ChartRadar, LoadingSkeleton, EmptyState | `web/components/ui/*` | After 1 |
| 3 | `layout-navigation` | Floating sidebar with project list, top navbar with breadcrumbs, AppShell grid layout, PageHeader | `web/components/layout/*` | After 1 |
| 4 | `database-api` | Docker Compose (PostgreSQL), Drizzle ORM schema, all CRUD API routes, .env.example | `web/docker-compose.yml`, `web/drizzle.config.ts`, `web/lib/db/*`, `web/app/api/*` | After 1 |
| 5 | `dashboard-pages` | All page components: dashboard overview, projects list, project detail, audit detail, new audit page | `web/app/page.tsx`, `web/app/projects/*`, `web/app/new-audit/*`, `web/components/dashboard/*` | After 2, 3 |
| 6 | `audit-engine` | Claude Code CLI spawning, audit runner, streaming progress, result parsers, audit form/progress components | `web/lib/audit-engine/*`, `web/components/audit/*` | After 4 |

## Constraints

- **Off-limits**: All existing files except `.gitignore` (may add web/ entries)
- **No Claude Agent SDK** — use Claude Code CLI spawning only
- **HeroUI v3 compound component API** — `Card.Header` not `CardHeader`
- **Acceptance**: Full working MVP — input URL -> audit runs -> results in DB -> dashboard with charts

## Acceptance Criteria

1. User can create a project with a URL
2. User can trigger an SEO audit from the dashboard
3. Audit runs via Claude Code CLI (no API costs)
4. Real-time progress streaming during audit
5. Results stored in PostgreSQL with per-category scores
6. Dashboard shows overall score, category breakdown charts, issue list
7. Action plan displayed with priority grouping
8. Floating sidebar for project navigation
9. Top navbar with breadcrumbs
10. Responsive grid layout
11. Dark mode support
12. All wrapper components use consistent HeroUI v3 theming
