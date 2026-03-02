# Agent Instructions

## Project
**Name**: claude-seo
**Description**: SEO analysis skill for Claude Code CLI, being extended with a web dashboard

## Stack
### Existing (CLI Skills)
- Python 3.8+ (beautifulsoup4, requests, lxml, playwright)
- Markdown skill files + agent definitions for Claude Code

### New (Web Dashboard)
- Next.js 15 (App Router)
- React 19
- HeroUI v3 (@heroui/react@beta + @heroui/styles@beta)
- Tailwind CSS v4 + @heroui/styles
- TypeScript
- Claude Code CLI (spawned via child_process for audits — no API costs)
- Recharts (charting)
- Drizzle ORM + PostgreSQL (Docker)
- Docker Compose (database)
- tailwind-variants

## Commands
```bash
# Install (web app)
cd web && npm install
# Dev server
cd web && npm run dev
# Tests
none configured yet
# Database
docker compose up -d
```

## Key Structure
- `scripts/` — Python scripts (fetch_page.py, parse_html.py) used by audit engine
- `skills/` — Claude Code skill definitions (12 sub-skills)
- `agents/` — Subagent definitions (6 specialist agents)
- `seo/` — Main orchestrator skill + reference files
- `web/` — NEW: Next.js dashboard application
- `docs/` — Documentation (architecture, commands, installation)

## Conventions
- Naming: PascalCase for React components, kebab-case for files/routes
- Imports: Named imports from `@heroui/react`, absolute imports with `@/` alias
- Styling: Tailwind CSS utility classes + HeroUI component theming
- Components: Wrapper components in `web/src/components/ui/` for theme consistency

## Git
- Branch format: `worker/<task-slug>`
- Commit format: `<type>: <description>` (types: feat, fix, refactor, style)

## Off-Limits
Never modify:
- `skills/` — Claude Code skill definitions
- `agents/` — Subagent definitions
- `seo/` — Main orchestrator skill
- `scripts/` — Python utility scripts
- `hooks/` — Git hooks
- `schema/` — Schema templates
- `docs/` — Existing documentation
- `install.sh`, `install.ps1`, `uninstall.sh` — Installation scripts
- `README.md` — Project README
- `.gitignore` — Git ignore rules (may need additions for web/)
