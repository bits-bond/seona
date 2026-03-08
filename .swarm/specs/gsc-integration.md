# Task: Google Search Console Integration

## Objective
Create a new Claude Code skill and agent for Google Search Console (GSC) data analysis. The skill surfaces search performance data (queries, impressions, clicks, CTR, positions), index coverage issues, and crawl statistics. It uses the optional `mcp-server-gsc` MCP server — when not configured, it provides a framework assessment and recommends GSC setup. Update the main orchestrator skill to reference the new agent for full audits.

## Scope

### Create These Files
- `skills/seo-gsc/SKILL.md` — Google Search Console analysis skill. Triggers on: "Search Console", "GSC", "search performance", "impressions", "CTR", "index coverage", "crawl stats", "search queries"
- `agents/seo-gsc.md` — GSC analysis subagent for parallel dispatch during full audits

### Modify These Files
- `seo/SKILL.md` — Register ALL new skills and agents from this swarm mission (this worker is the only one with write access to the orchestrator):
  1. Add rows to Quick Reference table:
     - `| /seo gsc <url> | Google Search Console analysis |`
     - `| /seo backlinks <url> | Backlink profile analysis |`
     - `| /seo competitor <url> | Competitor gap analysis |`
     - `| /seo keywords <url> | Keyword research & opportunity mapping |`
     - `| /seo fixes <url> | Generate implementation-ready fixes |`
  2. Add new agents to the subagent spawn list in Orchestration Logic (step 2): append `seo-gsc, seo-backlinks, seo-competitor, seo-keywords, seo-geo, seo-fixes` to existing list of 6 agents
  3. Add entries to Sub-Skills and Subagents listing sections for all new skills/agents
  4. Keep changes surgical — only add new entries to existing lists/tables, do NOT restructure existing content

### Read for Patterns (do not modify)
- `skills/seo-technical/SKILL.md` — Skill format reference
- `skills/seo-content/SKILL.md` — Another skill format reference
- `agents/seo-technical.md` — Agent format reference (tools list, methodology, output format)
- `agents/seo-content.md` — Agent format reference
- `seo/SKILL.md` — Current orchestrator structure (Quick Reference table, Orchestration Logic, Sub-Skills list) — read fully to understand where to add references

### Off-Limits (never touch)
- `web/` — Entire web dashboard (pdf-export worker's domain)
- `scripts/` — Python scripts (backlink-competitor worker's domain)
- `skills/seo-geo/` — GEO skill (geo-expansion-fixes worker's domain)
- `skills/seo-backlinks/`, `skills/seo-competitor/` — Backlink worker's domain
- `skills/seo-keywords/` — Keyword worker's domain
- All existing agents (only create new `agents/seo-gsc.md`)

## Context

### MCP Integration Pattern
The `mcp-server-gsc` MCP server provides Google Search Console data when configured. The skill must handle two modes:

**When MCP IS configured:**
- Call MCP tools to fetch search analytics data (queries, pages, impressions, clicks, CTR, position)
- Call MCP tools for index coverage data (valid, errors, warnings, excluded)
- Call MCP tools for crawl stats (crawl requests, response codes, sizes)
- Process and analyze the returned data

**When MCP is NOT configured:**
- Explain what GSC data would reveal and why it matters
- Provide a checklist for GSC setup and verification
- Analyze what CAN be inferred from robots.txt, sitemap.xml, and meta robots tags
- Note: "Connect Google Search Console for full search performance data"
- Still provide actionable value: sitemap validation, robots.txt review, canonical tag analysis

### Orchestrator Skill Current Structure (seo/SKILL.md)
The Quick Reference table has entries like:
```
| `/seo audit <url>` | Full website audit with parallel subagent delegation |
| `/seo page <url>` | Deep single-page analysis |
```

The Orchestration Logic section says:
```
When the user invokes `/seo audit`, delegate to subagents in parallel:
1. Detect business type (SaaS, local, ecommerce, publisher, agency, other)
2. Spawn subagents: seo-technical, seo-content, seo-schema, seo-sitemap, seo-performance, seo-visual
3. Collect results and generate unified report with SEO Health Score (0-100)
```

You add `seo-gsc` to that list in step 2.

### GSC Data Categories

1. **Search Performance** — Top queries with impressions, clicks, CTR, average position
2. **CTR Optimization** — Pages with high impressions but low CTR (title/description optimization opportunities)
3. **Index Coverage** — Indexed pages vs excluded pages (and exclusion reasons: crawled not indexed, discovered not crawled, blocked by robots.txt, etc.)
4. **Crawl Statistics** — Googlebot crawl frequency, response times, crawl budget usage
5. **Sitemap Status** — Submitted sitemaps, URLs submitted vs indexed

## Acceptance Criteria
- [ ] `skills/seo-gsc/SKILL.md` follows exact YAML frontmatter format with trigger keywords
- [ ] `agents/seo-gsc.md` follows agent format with tools list, methodology steps, output format
- [ ] Skill covers: search performance, CTR optimization, index coverage, crawl stats, sitemap status
- [ ] Skill gracefully handles missing MCP server (framework analysis + setup guide)
- [ ] Skill includes MCP tool usage instructions for when `mcp-server-gsc` IS available
- [ ] `seo/SKILL.md` updated: Quick Reference table has rows for gsc, backlinks, competitor, keywords, fixes
- [ ] `seo/SKILL.md` updated: Orchestration Logic subagent list includes all new agents (seo-gsc, seo-backlinks, seo-competitor, seo-keywords, seo-geo, seo-fixes)
- [ ] `seo/SKILL.md` updated: Sub-Skills and Subagents sections list all new entries
- [ ] Changes to `seo/SKILL.md` are minimal and surgical (only add entries to existing lists/tables, don't restructure)
- [ ] Output format includes XX/100 score and prioritized recommendations
- [ ] No modifications to any files outside the specified scope

## Technical Guidance

### GSC Skill Scoring Structure
```
## GSC Analysis Criteria

### 1. Search Visibility (25%)
- Total impressions and click trends
- Query coverage (how many unique queries trigger the site)
- Average position distribution

### 2. Click-Through Optimization (25%)
- Pages with high impressions but CTR < 3% (optimization targets)
- Title tag effectiveness analysis
- Meta description click-worthiness
- Rich result presence impact on CTR

### 3. Index Health (25%)
- Ratio of submitted to indexed pages
- Exclusion reasons breakdown
- Pages stuck in "Discovered - not indexed"
- Pages with "Crawled - not indexed" (quality signals)

### 4. Crawl Efficiency (15%)
- Crawl budget utilization
- Response time averages
- Server error rates during crawls
- Crawl frequency trends

### 5. Sitemap Accuracy (10%)
- URLs in sitemap vs URLs indexed
- Sitemap errors and warnings
- Last crawl dates for sitemap URLs
```

### Agent Methodology
The agent should:
1. Check if `mcp-server-gsc` MCP tools are available
2. If available: fetch search analytics for last 28 days + 3 months comparison
3. If not available: analyze robots.txt, sitemap.xml, canonical tags, meta robots
4. Identify low-CTR high-impression pages (quick wins)
5. Flag index coverage issues
6. Provide prioritized recommendations

## Dependencies
- **Requires output from**: none
- **Provides to**: none (skill is independently invocable via `/seo gsc <url>`)

## Completion Signal
When **all acceptance criteria are met**, output:
`<promise>GSC_INTEGRATION_COMPLETE</promise>`

If blocked and unable to continue, write details to `BLOCKERS.md` then output:
`<promise>GSC_INTEGRATION_BLOCKED</promise>`
