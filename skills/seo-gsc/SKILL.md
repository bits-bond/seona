---
name: seo-gsc
description: >
  Google Search Console data analysis for search performance, CTR optimization,
  index coverage, crawl statistics, and sitemap status. Uses mcp-server-gsc MCP
  server when configured; provides framework analysis and setup guidance when not.
  Use when user says "Search Console", "GSC", "search performance", "impressions",
  "CTR", "index coverage", "crawl stats", or "search queries".
---

# Google Search Console Analysis

## MCP Server Detection

This skill relies on the optional `mcp-server-gsc` MCP server. Before analysis, check if GSC MCP tools are available.

### When MCP IS Configured

Use MCP tools to fetch real GSC data:

1. **Search Analytics** — Call MCP to fetch search performance data for the last 28 days and 3-month comparison:
   - Top queries by impressions and clicks
   - Top pages by impressions and clicks
   - CTR and average position per query/page
   - Device and country breakdowns
2. **Index Coverage** — Call MCP to fetch index status:
   - Valid (indexed) pages count
   - Pages with errors (server errors, redirect errors, etc.)
   - Pages with warnings (indexed despite issues)
   - Excluded pages with exclusion reasons
3. **Crawl Statistics** — Call MCP to fetch crawl data:
   - Total crawl requests per day
   - Average response time
   - Response code distribution (200, 301, 404, 500, etc.)
   - Crawl type breakdown (discovery vs refresh)
4. **Sitemap Status** — Call MCP to fetch sitemap data:
   - Submitted sitemaps and their status
   - URLs submitted vs URLs indexed per sitemap
   - Last crawl date per sitemap

### When MCP is NOT Configured — Direct API via Script

If a Google service account key is available, use `scripts/gsc_query.py` as an alternative to MCP:

```bash
# List accessible properties
scripts/gsc_query.py list-sites --key-file sa.json

# Search analytics (queries, pages, CTR, position)
scripts/gsc_query.py analytics --site sc-domain:example.com --key-file sa.json --days 28 --dimension query
scripts/gsc_query.py analytics --site sc-domain:example.com --key-file sa.json --dimension page

# URL inspection (index status, crawl info, canonical)
scripts/gsc_query.py inspect https://example.com/page --site sc-domain:example.com --key-file sa.json

# Sitemap status (submitted vs indexed)
scripts/gsc_query.py sitemaps --site sc-domain:example.com --key-file sa.json

# Request indexing (200/day quota)
scripts/gsc_query.py index-request https://example.com/page --key-file sa.json

# Batch URL inspection (from file, one URL per line)
scripts/gsc_query.py batch-inspect --urls-file urls.txt --site sc-domain:example.com --key-file sa.json

# Batch indexing from sitemap (respects 200/day quota)
scripts/gsc_query.py index-batch --sitemap-url https://example.com/sitemap.xml --key-file sa.json --limit 200

# Parse GSC Coverage CSV exports (no API key needed)
scripts/gsc_query.py coverage --path ./Coverage-Drilldown-export/

# Parse GSC Links CSV exports (no API key needed)
scripts/gsc_query.py links --path ./Links-export/

# Full 3-phase SEO audit (collects analytics, inspections, CWV, identifies issues, scores)
scripts/gsc_query.py audit --site sc-domain:example.com --key-file sa.json --days 28
```

Environment variables `GSC_KEY_FILE`, `GSC_SITE_URL`, `GSC_DEFAULT_DAYS` can be set as alternatives to CLI flags.

### When Neither MCP nor Service Account is Available

Provide value without GSC data:

1. **Explain what GSC data would reveal** — Describe the insights users are missing
2. **Framework analysis** — Analyze what CAN be inferred:
   - Fetch and validate `robots.txt` for crawl directives
   - Fetch and validate `sitemap.xml` for URL coverage
   - Check `<meta name="robots">` tags on key pages
   - Analyze canonical tag implementation
   - Check for noindex/nofollow directives
3. **GSC setup checklist:**
   - Verify domain ownership (DNS TXT record, HTML file, or Google Analytics)
   - Add both `https://` and `http://` properties
   - Set preferred domain (www vs non-www)
   - Submit XML sitemap in GSC
   - Configure the `mcp-server-gsc` MCP server for Claude Code integration
4. **Note:** "Connect Google Search Console for full search performance data"

## GSC Analysis Criteria

### 1. Search Visibility (25%)
- Total impressions and click trends (28-day and 3-month comparison)
- Query coverage (how many unique queries trigger the site)
- Average position distribution (positions 1-3, 4-10, 11-20, 20+)
- Brand vs non-brand query ratio

### 2. Click-Through Optimization (25%)
- Pages with high impressions but CTR < 3% (optimization targets)
- Title tag effectiveness analysis (character length, keyword placement, power words)
- Meta description click-worthiness (character length, call-to-action presence)
- Rich result presence impact on CTR
- Position-adjusted CTR benchmarks:
  - Position 1: expected CTR ~27-30%
  - Position 2: expected CTR ~15-18%
  - Position 3: expected CTR ~10-12%
  - Positions 4-10: expected CTR ~2-7%

### 3. Index Health (25%)
- Ratio of submitted to indexed pages
- Exclusion reasons breakdown:
  - **Crawled — currently not indexed** (quality/relevance issue)
  - **Discovered — currently not indexed** (crawl budget/priority issue)
  - **Blocked by robots.txt** (intentional vs accidental)
  - **Excluded by noindex tag** (verify intentional)
  - **Duplicate without user-selected canonical** (consolidation needed)
  - **Duplicate, Google chose different canonical** (canonical conflicts)
  - **Page with redirect** (redirect chain review)
  - **Soft 404** (content quality issue)
- Pages stuck in "Discovered — not indexed" (crawl priority signals)
- Pages with "Crawled — not indexed" (content quality signals)

### 4. Crawl Efficiency (15%)
- Crawl budget utilization (requests per day trend)
- Response time averages (target <500ms)
- Server error rates during crawls (5xx responses)
- Crawl frequency trends (increasing = healthy, decreasing = concern)
- Wasted crawl budget on non-canonical or redirected URLs

### 5. Sitemap Accuracy (10%)
- URLs in sitemap vs URLs indexed (coverage ratio)
- Sitemap errors and warnings
- Last crawl dates for sitemap URLs (stale sitemaps)
- Sitemap index structure for large sites (>50k URLs)

## CTR Quick Wins Identification

Identify pages that are the highest-impact CTR optimization targets:
1. Filter pages with impressions > 100/month
2. Filter pages with position < 10 (page 1)
3. Sort by gap between expected CTR (based on position) and actual CTR
4. Top 10 pages = highest-impact title/description rewrites

## Output

### GSC Analysis Score: XX/100

### Data Source
- 🟢 **Live GSC Data** via MCP (or)
- 🟡 **Framework Analysis** — GSC not connected. Connect for full data.

### Category Breakdown
| Category | Status | Score |
|----------|--------|-------|
| Search Visibility | ✅/⚠️/❌ | XX/25 |
| Click-Through Optimization | ✅/⚠️/❌ | XX/25 |
| Index Health | ✅/⚠️/❌ | XX/25 |
| Crawl Efficiency | ✅/⚠️/❌ | XX/15 |
| Sitemap Accuracy | ✅/⚠️/❌ | XX/10 |

### Top CTR Quick Wins
| Page | Position | Impressions | Current CTR | Expected CTR | Gap |
|------|----------|-------------|-------------|--------------|-----|
| ... | ... | ... | ... | ... | ... |

### Index Coverage Summary
| Status | Count | % of Total |
|--------|-------|------------|
| Valid (Indexed) | ... | ... |
| Errors | ... | ... |
| Warnings | ... | ... |
| Excluded | ... | ... |

### Critical Issues (fix immediately)
### High Priority (fix within 1 week)
### Medium Priority (fix within 1 month)
### Low Priority (backlog)

### Recommendations
Prioritized list of actionable improvements with expected impact.
