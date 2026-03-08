# Task: GEO Expansion + Automated Fix Implementation

## Objective
Expand the existing GEO (AI Search Visibility) skill with brand mention querying, share-of-voice tracking, llms.txt file generation, and AI citation optimization suggestions. Additionally, create a new automated fix implementation skill that generates ready-to-deploy code: complete meta tags, Open Graph/Twitter Card tags, redirect rules, hreflang implementation files, and CMS-specific patches for WordPress, Shopify, and Strapi.

## Scope

### Create These Files
- `agents/seo-geo.md` — GEO analysis subagent (currently no agent exists for GEO — only the skill). For parallel dispatch during full audits
- `skills/seo-fixes/SKILL.md` — Automated fix implementation skill. Triggers on: "generate fixes", "fix implementation", "meta tags", "OG tags", "redirect rules", "hreflang implementation", "CMS patch", "auto fix", "implementation code"
- `agents/seo-fixes.md` — Fix implementation subagent for parallel dispatch

### Modify These Files
- `skills/seo-geo/SKILL.md` — Expand with new sections:
  1. **Brand Mention Analysis**: methodology for querying AI platforms for brand visibility
  2. **Share of Voice**: framework for measuring brand presence in AI-generated answers vs competitors
  3. **llms.txt Generator**: instructions for creating and structuring the `/llms.txt` file (not just detection — actual generation with content blocks)
  4. **Citation Optimization**: specific rewrite suggestions to improve passage-level citability (optimal 134-167 word passages, quotable sentence patterns, fact-first structures)
  5. **AI Crawler Monitoring**: expanded guidance on analyzing access logs for GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot patterns

### Read for Patterns (do not modify)
- `skills/seo-geo/SKILL.md` — READ FULLY before modifying. Understand existing structure: Key Statistics, Critical Insight, GEO Analysis Criteria (5 sections with % weights), AI Crawler tokens, platform-specific optimization. Preserve all existing content — only ADD new sections
- `skills/seo-technical/SKILL.md` — Skill format reference
- `skills/seo-schema/SKILL.md` — Schema skill reference (generates ready-to-use code — same pattern for fix implementation)
- `agents/seo-technical.md` — Agent format reference
- `agents/seo-content.md` — Agent format reference
- `seo/SKILL.md` — Orchestrator reference (read only, do NOT modify — gsc-integration worker handles orchestrator changes)
- `scripts/parse_html.py` — HTML parsing patterns (for understanding what page data is available)

### Off-Limits (never touch)
- `web/` — Entire web dashboard
- `scripts/` — Python scripts (read only for reference)
- `seo/SKILL.md` — Orchestrator (gsc-integration worker's domain)
- `skills/seo-backlinks/`, `skills/seo-competitor/` — Backlink worker's domain
- `skills/seo-gsc/` — GSC worker's domain
- `skills/seo-keywords/` — Keyword worker's domain
- All existing agents (only create new ones)
- All other existing skills (only modify `seo-geo`, create `seo-fixes`)

## Context

### Current GEO Skill Structure (seo-geo/SKILL.md)
The existing skill has these sections:
1. Key Statistics table (AI Overviews reach, ChatGPT users, Perplexity queries)
2. Critical Insight: Brand Mentions > Backlinks (Ahrefs study, correlation table)
3. GEO Analysis Criteria:
   - 1. Citability Score (25%) — passage length, quotable sentences
   - 2. Structural Readability (20%) — heading hierarchy, lists, tables
   - 3. Multi-Modal Content (15%) — text + images/video, 156% higher selection
   - 4. Authority & Brand Signals (20%) — author byline, dates, citations
   - 5. Technical Accessibility (20%) — SSR, AI crawlers, llms.txt, RSL 1.0
4. AI Crawler tokens list
5. Platform-specific optimization (Google AIO, ChatGPT, Perplexity)

**Preserve ALL of this.** Add new sections AFTER the existing content.

### llms.txt Standard
The `/llms.txt` file is an emerging standard for providing structured content guidance to AI crawlers. Format:
```
# [Site Name]

> [One-line description]

## About
[2-3 paragraphs about the site/company]

## Key Content
- [URL]: [Description]
- [URL]: [Description]

## Contact
[Contact information]
```

The skill should generate this file content based on the audited site's information.

### Fix Implementation Patterns
The fix skill generates ready-to-deploy code. Examples:

**Meta Tags:**
```html
<!-- Page: /about -->
<title>About Us - Company Name | Industry Description</title>
<meta name="description" content="150-160 char description...">
<link rel="canonical" href="https://example.com/about">
```

**Open Graph:**
```html
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:url" content="...">
<meta property="og:image" content="...">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_US">
<meta property="og:site_name" content="...">
```

**Redirect Rules (.htaccess):**
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

**Cloudflare Page Rules:**
```
URL: http://*example.com/*
Setting: Always Use HTTPS

URL: https://www.example.com/*
Setting: Forwarding URL (301) → https://example.com/$1
```

### Agent File Format
```yaml
---
name: seo-geo
description: [Role description]
tools: Read, Bash, Write, Glob, Grep
---

You are a [Role] specialist. When given [input]:
1. [Steps]

## [Reference sections]
## Output Format
```

## Acceptance Criteria
- [ ] `skills/seo-geo/SKILL.md` retains ALL existing content unchanged
- [ ] GEO skill expanded with: Brand Mention Analysis, Share of Voice, llms.txt Generator, Citation Optimization, AI Crawler Monitoring sections
- [ ] `agents/seo-geo.md` created with proper format, tools list, methodology, output format
- [ ] `skills/seo-fixes/SKILL.md` follows exact YAML frontmatter format with trigger keywords
- [ ] `agents/seo-fixes.md` follows agent format with tools list, methodology, output format
- [ ] Fix skill generates: complete meta tags, OG tags, Twitter Card tags, canonical tags for every crawled page
- [ ] Fix skill generates: redirect rules in both .htaccess and Cloudflare formats
- [ ] Fix skill generates: hreflang implementation (HTML tags, HTTP headers, or XML sitemap format)
- [ ] Fix skill includes CMS-specific patches for WordPress (functions.php/plugin), Shopify (theme.liquid), Strapi (middleware)
- [ ] llms.txt generator produces valid llms.txt content from site analysis
- [ ] Citation optimization provides specific rewrite examples (before/after)
- [ ] Both new agents include XX/100 scoring and prioritized recommendations
- [ ] No modifications to files outside the specified scope

## Technical Guidance

### GEO Expansion Sections to Add

**Brand Mention Analysis:**
- Methodology for searching AI platforms for brand mentions
- Query patterns: "[brand name]", "[brand] + [industry]", "[competitor] alternatives"
- Score factors: mention frequency, context quality (recommendation vs neutral), platform breadth
- Cross-platform comparison: Google AIO vs ChatGPT vs Perplexity results

**Share of Voice:**
- Define SOV as: (brand mentions / total category mentions) across AI platforms
- Tracking methodology for key queries in the brand's domain
- Comparison framework vs top 3-5 competitors
- Trend indicators (growing/stable/declining visibility)

**llms.txt Generator:**
- Analyze site structure, about page, key content pages
- Generate properly formatted llms.txt with all required sections
- Include content descriptions optimized for AI understanding
- Output as ready-to-deploy file content

**Citation Optimization:**
- Identify passages that COULD be cited but aren't structured optimally
- Provide before/after rewrites:
  - Before: "We have extensive experience in cybersecurity consulting."
  - After: "Since 2018, Watchmen has delivered zero-trust security consulting to 200+ enterprise clients including ASML, ABN AMRO, and the Dutch Ministry of Defence."
- Focus on: specificity, attribution, self-contained passages, fact-first structure

### Fix Skill Structure
```
## Fix Generation Categories

### 1. Meta Tags (title, description, canonical)
Generate for every crawled page based on content analysis

### 2. Social Tags (Open Graph, Twitter Card)
Generate og:title, og:description, og:image, og:url, og:type
Generate twitter:card, twitter:title, twitter:description, twitter:image

### 3. Redirect Rules
HTTP → HTTPS, www → non-www (or vice versa)
Both .htaccess and Cloudflare formats

### 4. Hreflang Implementation
Based on detected language/region targets
Three formats: HTML link tags, HTTP headers, XML sitemap

### 5. CMS-Specific Patches
WordPress: functions.php snippets or plugin recommendations
Shopify: theme.liquid modifications
Strapi: middleware configuration for headers
```

## Dependencies
- **Requires output from**: none
- **Provides to**: none

## Completion Signal
When **all acceptance criteria are met**, output:
`<promise>GEO_EXPANSION_FIXES_COMPLETE</promise>`

If blocked and unable to continue, write details to `BLOCKERS.md` then output:
`<promise>GEO_EXPANSION_FIXES_BLOCKED</promise>`
