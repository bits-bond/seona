---
name: seo-audit
description: >
  Full website SEO audit with parallel subagent delegation. Crawls up to 500
  pages, detects business type, delegates to 7 specialists, generates health
  score. Use when user says "audit", "full SEO check", "analyze my site",
  or "website health check".
---

# Full Website SEO Audit

## Process

1. **Fetch homepage** — use `scripts/fetch_page.py` to retrieve HTML
2. **Detect business type** — analyze homepage signals per seo orchestrator
3. **Crawl site** — follow internal links up to 500 pages, respect robots.txt
4. **Delegate to subagents** (if available, otherwise run inline sequentially):
   - `seo-technical` — robots.txt, sitemaps, canonicals, Core Web Vitals, security headers
   - `seo-content` — E-E-A-T, readability, thin content, AI citation readiness
   - `seo-schema` — detection, validation, generation recommendations
   - `seo-sitemap` — structure analysis, quality gates, missing pages
   - `seo-performance` — LCP, INP, CLS measurements
   - `seo-visual` — screenshots, mobile testing, above-fold analysis
5. **Score** — aggregate into SEO Health Score (0-100)
6. **Report** — generate prioritized action plan

## Crawl Configuration

```
Max pages: 500
Respect robots.txt: Yes
Follow redirects: Yes (max 3 hops)
Timeout per page: 30 seconds
Concurrent requests: 5
Delay between requests: 1 second
```

## Output Files

- `FULL-AUDIT-REPORT.md` — Comprehensive findings
- `ACTION-PLAN.md` — Prioritized recommendations (Critical → High → Medium → Low)
- `screenshots/` — Desktop + mobile captures (if Playwright available)

## Scoring Weights

| Category | Weight |
|----------|--------|
| Technical SEO | 25% |
| Content Quality | 25% |
| On-Page SEO | 20% |
| Schema / Structured Data | 10% |
| Performance (CWV) | 10% |
| Images | 5% |
| AI Search Readiness | 5% |

## Report Structure

### Executive Summary
- Overall SEO Health Score (0-100)
- Business type detected
- Top 5 critical issues
- Top 5 quick wins

### Technical SEO
- Crawlability issues
- Indexability problems
- Security concerns
- Core Web Vitals status

### Content Quality
- E-E-A-T assessment
- Thin content pages
- Duplicate content issues
- Readability scores

### On-Page SEO
- Title tag issues
- Meta description problems
- Heading structure
- Internal linking gaps

### Schema & Structured Data
- Current implementation
- Validation errors
- Missing opportunities

### Performance
- LCP, INP, CLS scores
- Resource optimization needs
- Third-party script impact

### Images
- Missing alt text
- Oversized images
- Format recommendations

### AI Search Readiness
- Citability score
- Structural improvements
- Authority signals

## Priority Definitions

- **Critical**: Blocks indexing or causes penalties (fix immediately)
- **High**: Significantly impacts rankings (fix within 1 week)
- **Medium**: Optimization opportunity (fix within 1 month)
- **Low**: Nice to have (backlog)

## Output Format Specification (MANDATORY)

The following format rules MUST be followed exactly. These are machine-parsed tokens — deviating breaks downstream processing. These tokens are ALWAYS in English, even when the report content is in German or another language.

### FULL-AUDIT-REPORT.md Format

The overall score line MUST appear exactly as:

```
### Overall SEO Health Score: N/100
```

where N is an integer 0-100. No spaces around the slash. No bold formatting.

The category breakdown table MUST use exactly these column headers and category names:

```
| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 25% | N/100 | N.NN |
| Content Quality | 25% | N/100 | N.NN |
| On-Page SEO | 20% | N/100 | N.NN |
| Schema / Structured Data | 10% | N/100 | N.NN |
| Performance (CWV) | 10% | N/100 | N.NN |
| Images | 5% | N/100 | N.NN |
| AI Search Readiness | 5% | N/100 | N.NN |
| **Overall** | **100%** | | **N/100** |
```

Rules:
- Category names are ALWAYS in English, even when report body is in another language
- Weighted scores use dot decimal (7.50 not 7,50)
- Score column uses N/100 format (no spaces around slash)
- No extra columns (no Status column)

### ACTION-PLAN.md Format

Severity section headers MUST be exactly:

```
## CRITICAL
## HIGH
## MEDIUM
## LOW
```

No suffixes, no "Phase N:" prefixes, no translated labels. Section content can be in any language.

Issue titles MUST use sequential numbering:

```
### 1. Title here
### 2. Another issue
```

Do NOT use letter prefixes (C1, H2, K1) or hierarchical numbering (1.1, 1.2).
