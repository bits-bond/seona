# Swarm Mission: SEONA Service Enhancement Suite

**Date:** 2026-03-08
**Branch:** main
**Workers:** 5

## Mission Description

Implement 7 major features to transform SEONA from a technical audit tool into a premium agency-grade SEO service platform. Features include backlink analysis, competitor gap analysis, Google Search Console integration, professional PDF export (Executive + Full Report in DE/EN), keyword research & opportunity mapping, expanded AI search visibility (GEO), and automated fix implementation.

All MCP-based integrations (Ahrefs, Semrush, GSC) must be **optional enrichments** — the audit works without them, and extra data is added when MCP servers are configured. Claude CLI handles all translation — no i18n library needed, just a small label lookup for PDF template headers.

## Task Breakdown

| # | Slug | Objective | Primary Files |
|---|------|-----------|---------------|
| 1 | `pdf-export` | PDF export system with DE/EN language support. Playwright renderer, SVG charts, A4 dark-theme templates (Executive Summary + Full Technical Report), language column in DB, language selector in audit form, runner prompt injection, parser German mappings, API route, dashboard export button | `web/lib/pdf/*` (new), `web/lib/db/schema.ts`, `web/types/index.ts`, `web/app/new-audit/page.tsx`, `web/lib/audit-engine/runner.ts`, `web/lib/audit-engine/parser.ts`, `web/app/api/audits/route.ts`, `web/app/api/audits/[id]/route.ts`, `web/app/api/audits/[id]/run/route.ts`, `web/app/api/audits/[id]/pdf/` (new), `web/app/projects/[id]/audits/[auditId]/page.tsx` |
| 2 | `backlink-competitor` | Backlink profile analysis + competitor gap analysis. New skills/agents for backlink profiling (referring domains, toxic links, anchor text, link velocity) and competitor gap analysis (keyword gap, content gap, backlink gap, SERP feature gap, technical benchmark). Optional Ahrefs/Semrush MCP enrichment | `skills/seo-backlinks/` (new), `skills/seo-competitor/` (new), `agents/seo-backlinks.md` (new), `agents/seo-competitor.md` (new), `scripts/analyze_backlinks.py` (new) |
| 3 | `gsc-integration` | Google Search Console integration. New skill/agent for GSC data: top queries, CTR optimization opportunities, index coverage, crawl stats. Optional via mcp-server-gsc. Update orchestrator to reference new agent | `skills/seo-gsc/` (new), `agents/seo-gsc.md` (new), `seo/SKILL.md` |
| 4 | `keyword-research` | Keyword research & opportunity mapping. New skill/agent for target keyword identification, search volume/difficulty (optional MCP), keyword clustering by intent, low-hanging fruit report (positions 4-20), content brief generation | `skills/seo-keywords/` (new), `agents/seo-keywords.md` (new) |
| 5 | `geo-expansion-fixes` | Expand AI Search Visibility (GEO): brand mention querying across AI platforms, share of voice tracking, llms.txt generator, citation optimization suggestions. Plus: expanded automated fix implementation — generate complete meta tags, OG/Twitter Card tags, redirect rules, hreflang files, CMS-specific patches | `skills/seo-geo/SKILL.md` (modify), `agents/seo-geo.md` (new), `skills/seo-fixes/` (new), `agents/seo-fixes.md` (new) |

## File Ownership (No Overlap)

| Worker | Exclusive Files |
|--------|----------------|
| pdf-export | `web/lib/pdf/*`, `web/lib/db/schema.ts`, `web/types/index.ts`, `web/app/new-audit/page.tsx`, `web/lib/audit-engine/runner.ts`, `web/lib/audit-engine/parser.ts`, `web/app/api/audits/**`, `web/app/projects/**/page.tsx` |
| backlink-competitor | `skills/seo-backlinks/`, `skills/seo-competitor/`, `agents/seo-backlinks.md`, `agents/seo-competitor.md`, `scripts/analyze_backlinks.py` |
| gsc-integration | `skills/seo-gsc/`, `agents/seo-gsc.md`, `seo/SKILL.md` |
| keyword-research | `skills/seo-keywords/`, `agents/seo-keywords.md` |
| geo-expansion-fixes | `skills/seo-geo/`, `agents/seo-geo.md`, `skills/seo-fixes/`, `agents/seo-fixes.md` |

## Constraints

- All MCP integrations are optional (graceful degradation when not configured)
- Workers can create/modify files in skills/, agents/, seo/, scripts/
- Workers must NOT modify: hooks/, install.sh, install.ps1, uninstall.sh, README.md, .gitignore, docker-compose.yml
- Workers commit to their own `worker/<slug>` branches
- No two workers modify the same file (see ownership table)
- Follow existing code patterns (kebab-case files, PascalCase components, Tailwind utility classes)
- Claude CLI handles all natural language translation — no i18n library

## Acceptance Criteria

1. PDF export works from dashboard: Executive Summary (2-5 pages) and Full Technical Report (15-25 pages)
2. PDF supports DE and EN via language selector in audit form
3. PDFs have professional dark-theme design with SEONA branding, SVG charts, page numbers
4. Each new skill/agent produces useful output in audit reports
5. MCP integrations gracefully degrade when servers aren't configured
6. No breaking changes to existing audit flow
7. All existing audits continue to work (language defaults to 'en')
8. Workers commit clean, focused changes to their branches
