# Task: Backlink Profile Analysis + Competitor Gap Analysis

## Objective
Create two new Claude Code skills and agents for backlink profile analysis and competitor gap analysis. The backlink skill analyzes a site's link profile (referring domains, toxic links, anchor text distribution, top linked pages). The competitor skill performs gap analysis across keywords, content, backlinks, SERP features, and technical benchmarks. Both skills use optional MCP integrations (Ahrefs, Semrush) for data enrichment — when MCP is not configured, they provide analysis guidance and frameworks based on crawlable data.

## Scope

### Create These Files
- `skills/seo-backlinks/SKILL.md` — Backlink profile analysis skill definition. Triggers on: "backlinks", "link profile", "referring domains", "toxic links", "anchor text", "disavow", "link building"
- `skills/seo-competitor/SKILL.md` — Competitor gap analysis skill definition. Triggers on: "competitor analysis", "keyword gap", "content gap", "competitive analysis", "competitor SEO", "SERP gap"
- `agents/seo-backlinks.md` — Backlink analysis subagent for parallel dispatch during full audits
- `agents/seo-competitor.md` — Competitor analysis subagent for parallel dispatch during full audits
- `scripts/analyze_backlinks.py` — Python script for basic link extraction from HTML (internal/external link profiling from crawled pages). Uses BeautifulSoup4 (already in requirements.txt). Extracts: all `<a>` tags with href, rel attributes, anchor text, internal vs external classification, follow vs nofollow

### Modify These Files
- None — all files are new

### Read for Patterns (do not modify)
- `skills/seo-technical/SKILL.md` — Skill file format: YAML frontmatter (`name`, `description` with trigger keywords), then markdown body with analysis criteria, scoring rubrics, output format
- `skills/seo-geo/SKILL.md` — Another skill example showing statistics tables, scoring criteria sections (percentage weights), strong/weak signals format
- `agents/seo-technical.md` — Agent file format: YAML frontmatter (`name`, `description`, `tools`), then role instructions, methodology steps, cross-skill delegation, output format
- `agents/seo-content.md` — Another agent example showing E-E-A-T scoring table format
- `scripts/parse_html.py` — Python script pattern: BeautifulSoup4 usage, argument parsing, JSON output to stdout
- `scripts/fetch_page.py` — HTTP fetching pattern: User-Agent header, SSRF prevention, timeout handling

### Off-Limits (never touch)
- `web/` — Entire web dashboard (pdf-export worker's domain)
- `seo/SKILL.md` — Orchestrator skill (gsc-integration worker's domain)
- `skills/seo-geo/` — GEO skill (geo-expansion-fixes worker's domain)
- All existing skills and agents not listed above

## Context

### Existing Skill Format (YAML Frontmatter)
```yaml
---
name: seo-backlinks
description: >
  [Multi-line description with trigger keywords at end]
---

# [Title]

## [Criteria sections with percentage weights]
### 1. [Category] (XX%)
[Analysis criteria]

## Output Format
[Score, tables, priorities]
```

### Existing Agent Format
```yaml
---
name: seo-backlinks
description: [One-line role description]
tools: Read, Bash, Write, Glob, Grep
---

You are a [Role] specialist. When given [input]:

1. [Step]
2. [Step]

## [Reference sections]

## Output Format
[Score, tables, priorities]
```

### MCP Integration Pattern (Optional Enrichment)
The skills should check if MCP tools are available. When Ahrefs or Semrush MCP is configured:
- Use `mcp__ahrefs__*` or `mcp__semrush__*` tool calls for data
- Backlinks: referring domains, domain rating, anchor text, new/lost links
- Keywords: search volume, difficulty, SERP features, positions

When MCP is NOT configured:
- Analyze crawlable link data from the page HTML (internal/external links, anchor text patterns)
- Provide a framework-based assessment with what CAN be determined from source inspection
- Clearly note: "External backlink data requires Ahrefs or Semrush MCP integration"
- Still provide actionable recommendations based on on-page link analysis

### Python Script Pattern (from parse_html.py)
- Takes URL or HTML file path as argument
- Uses BeautifulSoup4 for parsing
- Outputs structured JSON to stdout
- Handles errors gracefully with informative messages

### Scoring Convention
All skills/agents produce scores out of 100 with priority levels: Critical → High → Medium → Low

## Acceptance Criteria
- [ ] `skills/seo-backlinks/SKILL.md` follows exact YAML frontmatter format with trigger keywords
- [ ] `skills/seo-competitor/SKILL.md` follows exact YAML frontmatter format with trigger keywords
- [ ] `agents/seo-backlinks.md` follows agent format with tools list, methodology steps, output format
- [ ] `agents/seo-competitor.md` follows agent format with tools list, methodology steps, output format
- [ ] Backlink skill covers: referring domain analysis, toxic link detection, anchor text distribution, link velocity assessment, disavow file generation guidance
- [ ] Competitor skill covers: keyword gap, content gap, backlink gap, SERP feature gap, technical benchmark comparison
- [ ] Both skills gracefully handle missing MCP (provide framework analysis from crawlable data)
- [ ] Both skills include MCP integration instructions when Ahrefs/Semrush IS available
- [ ] `scripts/analyze_backlinks.py` extracts all links from HTML with anchor text, rel attributes, internal/external classification
- [ ] Python script follows existing patterns (BeautifulSoup4, JSON output, error handling)
- [ ] Output formats include XX/100 scores and prioritized recommendations
- [ ] No modifications to any existing files

## Technical Guidance

### Backlink Skill Structure
```
## Backlink Analysis Criteria

### 1. Referring Domain Quality (30%)
- Domain Rating/Authority distribution
- Topical relevance of referring domains
- Geographic relevance
- Link freshness (new vs established)

### 2. Anchor Text Profile (20%)
- Distribution analysis: branded vs exact match vs generic vs naked URL
- Over-optimization risk (>5% exact match is a red flag)
- Natural language patterns

### 3. Toxic Link Assessment (20%)
- Spammy domain patterns (PBNs, link farms)
- Penalty risk indicators
- Disavow recommendations

### 4. Link Velocity & Trends (15%)
- New links gained vs lost over time
- Sudden spikes or drops
- Sustainability of link building efforts

### 5. Page-Level Link Distribution (15%)
- Top linked pages vs orphan pages
- Homepage vs deep page link ratio
- Internal linking support for linked pages
```

### Competitor Skill Structure
```
## Competitor Gap Analysis

### 1. Keyword Gap (25%)
- Terms competitors rank for that client doesn't
- Shared terms where competitors outrank
- Difficulty vs opportunity assessment

### 2. Content Gap (25%)
- Topic clusters competitors cover
- Content types (blog, guides, tools, videos)
- Content freshness and update frequency

### 3. Backlink Gap (20%)
- Domains linking to competitors but not client
- Common referring domains
- Link acquisition opportunities

### 4. SERP Feature Gap (15%)
- Rich results competitors own (FAQ, video, product)
- Featured snippet ownership
- Knowledge panel presence

### 5. Technical Benchmark (15%)
- Page speed comparison
- Schema coverage comparison
- Mobile optimization comparison
```

### Competitor Crawling
The competitor agent should crawl 3-5 competitor homepages using the existing `scripts/fetch_page.py` and `scripts/parse_html.py` to extract:
- Title tags, meta descriptions, heading structure
- Schema markup types present
- Internal link count and structure
- Page load indicators (resource count, total size)

## Dependencies
- **Requires output from**: none
- **Provides to**: none (skills are independently invocable via `/seo backlinks <url>` and `/seo competitor <url>`)

## Completion Signal
When **all acceptance criteria are met**, output:
`<promise>BACKLINK_COMPETITOR_COMPLETE</promise>`

If blocked and unable to continue, write details to `BLOCKERS.md` then output:
`<promise>BACKLINK_COMPETITOR_BLOCKED</promise>`
