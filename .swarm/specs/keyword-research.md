# Task: Keyword Research & Opportunity Mapping

## Objective
Create a new Claude Code skill and agent for keyword research and opportunity mapping. The skill identifies target keywords from page content analysis, provides search volume and difficulty data when MCP is available (Semrush, Ahrefs, or kwrds.ai), clusters keywords by topic and intent, identifies low-hanging fruit opportunities (positions 4-20), and generates content brief suggestions. When no MCP data source is available, it provides keyword analysis based on content inspection, competitor title tags, and search intent classification.

## Scope

### Create These Files
- `skills/seo-keywords/SKILL.md` — Keyword research and opportunity mapping skill. Triggers on: "keyword research", "keywords", "keyword analysis", "keyword opportunities", "content brief", "keyword gap", "search volume", "keyword difficulty", "low-hanging fruit", "keyword mapping"
- `agents/seo-keywords.md` — Keyword research subagent for parallel dispatch during full audits

### Modify These Files
- None — all files are new. The orchestrator (`seo/SKILL.md`) is modified by the `gsc-integration` worker, not this one

### Read for Patterns (do not modify)
- `skills/seo-content/SKILL.md` — Content analysis skill (related domain — keyword analysis ties into content quality)
- `skills/seo-geo/SKILL.md` — GEO skill format reference (scoring criteria with percentage weights)
- `agents/seo-content.md` — Agent format reference
- `agents/seo-technical.md` — Agent format reference (tools, methodology, output)
- `seo/SKILL.md` — Orchestrator for understanding how skills are referenced

### Off-Limits (never touch)
- `web/` — Entire web dashboard
- `scripts/` — Python scripts
- `seo/SKILL.md` — Orchestrator (gsc-integration worker handles this)
- `skills/seo-geo/` — GEO skill (geo-expansion-fixes worker's domain)
- `skills/seo-backlinks/`, `skills/seo-competitor/` — Backlink worker's domain
- `skills/seo-gsc/` — GSC worker's domain
- All existing skills and agents not listed above

## Context

### MCP Data Sources (All Optional)
Three possible MCP providers for keyword data:
1. **`@ahrefs/mcp`** — Keywords Explorer: search volume, keyword difficulty, SERP features, click metrics
2. **Semrush MCP** — Keyword Analytics: search volume, difficulty, CPC, SERP features, positions
3. **kwrds.ai MCP** — Keyword research: search volume, difficulty, related terms

The skill must:
- Check if any of these MCP tools are available
- Use whichever is configured (prefer Ahrefs > Semrush > kwrds.ai)
- Work without ANY MCP by analyzing page content, titles, headings, and providing intent-based analysis

### Without MCP — What CAN Be Analyzed
Even without external keyword data, the skill can provide value by:
- Extracting target keywords from page title, H1, H2s, meta description
- Analyzing keyword usage in body content (density, placement, variations)
- Classifying search intent (informational, navigational, transactional, commercial)
- Identifying missing keyword opportunities from content gaps
- Suggesting keyword targets based on competitor title tag analysis (if competitor URLs provided)
- Recommending long-tail variations and related topics
- Mapping existing content to keyword clusters

### Scoring Convention
All skills produce scores out of 100 with priorities: Critical → High → Medium → Low

### Skill/Agent File Formats
See `skills/seo-technical/SKILL.md` and `agents/seo-technical.md` for exact format.

## Acceptance Criteria
- [ ] `skills/seo-keywords/SKILL.md` follows exact YAML frontmatter format with trigger keywords
- [ ] `agents/seo-keywords.md` follows agent format with tools list, methodology steps, output format
- [ ] Skill covers: target keyword identification, search volume/difficulty (when MCP available), keyword clustering, low-hanging fruit detection, content brief generation
- [ ] Skill gracefully handles missing MCP (content-based keyword analysis + framework guidance)
- [ ] Skill includes MCP tool usage instructions for Ahrefs, Semrush, and kwrds.ai
- [ ] Content brief section provides actionable writing guidance (target word count, headings to include, related terms to cover, search intent alignment)
- [ ] Low-hanging fruit section identifies keywords in positions 4-20 (when data available) or provides methodology for finding them
- [ ] Output format includes XX/100 score and prioritized recommendations
- [ ] No modifications to any existing files

## Technical Guidance

### Keyword Skill Scoring Structure
```
## Keyword Analysis Criteria

### 1. Keyword Targeting Quality (25%)
- Primary keyword identified and used in title, H1, first paragraph
- Secondary keywords in H2/H3 headings
- Semantic variations and LSI terms present
- Keyword density in natural range (1-3%)
- No keyword stuffing

### 2. Search Intent Alignment (25%)
- Content type matches search intent (informational → guide, transactional → product page)
- User journey stage addressed
- Content depth appropriate for intent
- Call-to-action aligned with intent

### 3. Keyword Opportunities (20%)
- Untapped keyword clusters identified
- Low-hanging fruit (positions 4-20 with high volume)
- Long-tail opportunities with low competition
- Question-based keywords for featured snippets

### 4. Content Coverage & Gaps (15%)
- Topic cluster completeness
- Missing subtopics vs competitors
- Content freshness and update opportunities
- Semantic coverage breadth

### 5. Competitive Positioning (15%)
- Keyword difficulty vs site authority assessment
- SERP feature opportunities
- Content differentiation potential
- Market share of target keywords
```

### Content Brief Output Format
When generating content briefs, include:
```
## Content Brief: [Target Keyword]

- **Primary Keyword**: [keyword] (volume: XX, difficulty: XX)
- **Secondary Keywords**: [list]
- **Search Intent**: [informational/transactional/commercial/navigational]
- **Recommended Word Count**: [range based on SERP analysis]
- **Suggested Structure**:
  - H1: [suggested title]
  - H2s: [suggested sections]
- **Topics to Cover**: [bulleted list]
- **Questions to Answer**: [from People Also Ask / related queries]
- **Internal Links to Include**: [relevant existing pages]
```

### Agent Methodology
1. Fetch target page(s) and extract content
2. Identify current keyword targets from on-page signals
3. If MCP available: pull search volume, difficulty, position data
4. If MCP unavailable: perform content-based keyword analysis
5. Cluster keywords by topic and intent
6. Identify gaps and opportunities
7. Generate content briefs for top opportunities
8. Score and prioritize recommendations

## Dependencies
- **Requires output from**: none
- **Provides to**: none (skill is independently invocable via `/seo keywords <url>`)

## Completion Signal
When **all acceptance criteria are met**, output:
`<promise>KEYWORD_RESEARCH_COMPLETE</promise>`

If blocked and unable to continue, write details to `BLOCKERS.md` then output:
`<promise>KEYWORD_RESEARCH_BLOCKED</promise>`
