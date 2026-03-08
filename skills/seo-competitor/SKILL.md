---
name: seo-competitor
description: >
  Competitor gap analysis across keywords, content, backlinks, SERP features,
  and technical benchmarks. Compares a client site against 3-5 competitors
  to identify ranking opportunities, content gaps, and strategic advantages.
  Supports optional Ahrefs/Semrush MCP integration for enriched data; without
  MCP, provides framework analysis from crawlable page data. Use when user
  says "competitor analysis", "keyword gap", "content gap", "competitive
  analysis", "competitor SEO", or "SERP gap".
---

# Competitor Gap Analysis

## MCP Integration

### When Ahrefs/Semrush MCP IS Available

Use MCP tool calls for enriched competitive data:
- `mcp__ahrefs__get_organic_keywords` — Keyword rankings for each domain
- `mcp__ahrefs__get_competing_domains` — Identify top competitors
- `mcp__ahrefs__get_backlinks` — Backlink profiles for comparison
- `mcp__semrush__domain_organic` — Organic keyword data per domain
- `mcp__semrush__keyword_gap` — Direct keyword gap analysis
- `mcp__semrush__backlinks_overview` — Backlink comparison metrics

### When MCP is NOT Available

Analyze competitors using crawlable data:
1. Fetch competitor homepages using `scripts/fetch_page.py`
2. Parse HTML using `scripts/parse_html.py` to extract:
   - Title tags, meta descriptions, heading structure
   - Schema markup types present
   - Internal link count and structure
   - Page resource count and estimated size
3. Compare on-page SEO elements across competitors
4. Identify content structure and topic coverage differences

**Note to user:** "Full keyword volume, ranking positions, and backlink metrics require Ahrefs or Semrush MCP integration. The analysis below is based on on-page inspection of competitor sites."

---

## Competitor Gap Analysis Criteria

### 1. Keyword Gap (25%)

**With MCP data:**
- Terms competitors rank for that client doesn't (opportunity keywords)
- Shared terms where competitors outrank client (improvement keywords)
- Keyword difficulty vs search volume assessment
- Long-tail keyword opportunities competitors are capturing
- SERP feature keywords competitors own

**Without MCP data:**
- Compare title tags and H1/H2 headings for keyword targeting differences
- Identify topic clusters from competitor heading structure
- Analyze meta descriptions for keyword targeting patterns
- Compare URL structures for keyword-rich paths

**Scoring:**
| Indicator | Good | Needs Improvement | Poor |
|-----------|------|-------------------|------|
| Keyword overlap with competitors | >60% shared | 30-60% shared | <30% shared |
| Gap keywords (opportunity) | <50 high-value gaps | 50-200 gaps | >200 gaps |
| Competitor outranking % | <20% of shared terms | 20-50% | >50% |

### 2. Content Gap (25%)

**With MCP data:**
- Topic clusters competitors cover that client doesn't
- Content types comparison (blog, guides, tools, videos, case studies)
- Content freshness — average publish/update dates
- Word count and content depth comparison
- Content format diversity (lists, how-tos, comparisons, reviews)

**Without MCP data (from crawl):**
- Compare H1/H2/H3 heading structures for topic coverage
- Analyze word count differences across comparable pages
- Check for content types present (blog sections, resource pages, FAQ pages)
- Compare schema markup coverage (FAQ, HowTo, Article, Product)
- Evaluate internal linking depth and structure

**Content type checklist:**
| Content Type | Client | Comp 1 | Comp 2 | Comp 3 | Gap? |
|-------------|--------|--------|--------|--------|------|
| Blog/Articles | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | Yes/No |
| Guides/Tutorials | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | Yes/No |
| Tools/Calculators | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | Yes/No |
| Case Studies | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | Yes/No |
| Video Content | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | Yes/No |
| FAQ Sections | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | Yes/No |
| Comparison Pages | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | Yes/No |

### 3. Backlink Gap (20%)

**With MCP data:**
- Domains linking to competitors but not to client
- Common referring domains across all competitors
- Unique referring domains per competitor
- Domain Rating comparison
- Link acquisition rate comparison

**Without MCP data:**
- Compare external link counts from crawled pages
- Analyze outbound link patterns (shared industry links)
- Identify potential link partners from competitor outbound links
- Compare internal link structure strength

**Gap assessment:**
| Metric | Client | Comp 1 | Comp 2 | Comp 3 |
|--------|--------|--------|--------|--------|
| Referring Domains | XX | XX | XX | XX |
| Domain Rating | XX | XX | XX | XX |
| Unique Domains | XX | XX | XX | XX |
| Link Growth/Month | XX | XX | XX | XX |

### 4. SERP Feature Gap (15%)

**With MCP data:**
- Rich results competitors own (FAQ, video, product, review)
- Featured snippet ownership by competitor
- Knowledge panel presence
- People Also Ask presence
- Image/video pack presence
- Local pack presence (if applicable)

**Without MCP data:**
- Compare schema markup types present on competitor pages
- Check for FAQ schema implementation
- Check for HowTo schema implementation
- Compare structured data coverage
- Assess content format suitability for featured snippets

**SERP feature checklist:**
| Feature | Client | Comp 1 | Comp 2 | Comp 3 | Opportunity |
|---------|--------|--------|--------|--------|-------------|
| FAQ Rich Results | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | High/Med/Low |
| How-To Rich Results | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | High/Med/Low |
| Product Snippets | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | High/Med/Low |
| Review Stars | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | High/Med/Low |
| Video Results | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | High/Med/Low |
| Featured Snippets | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | High/Med/Low |

### 5. Technical Benchmark (15%)

**From crawl data (always available):**
- Page speed indicators: resource count, total page size, render-blocking resources
- Schema coverage comparison (types and quantity)
- Mobile optimization signals (viewport meta, responsive indicators)
- Security: HTTPS enforcement, security headers
- URL structure quality comparison
- Internal linking depth and structure

**Technical comparison:**
| Metric | Client | Comp 1 | Comp 2 | Comp 3 | Winner |
|--------|--------|--------|--------|--------|--------|
| Page Size (KB) | XX | XX | XX | XX | - |
| Resource Count | XX | XX | XX | XX | - |
| Schema Types | XX | XX | XX | XX | - |
| Internal Links | XX | XX | XX | XX | - |
| HTTPS | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | - |
| Security Headers | X/5 | X/5 | X/5 | X/5 | - |

---

## Competitor Identification

### With MCP
Use `mcp__ahrefs__get_competing_domains` or `mcp__semrush__competitors_organic` to identify the top 3-5 organic competitors.

### Without MCP
Ask the user to provide 3-5 competitor URLs, or identify competitors from:
- Similar title tags and meta descriptions
- Shared outbound link destinations
- Similar schema markup and business type
- Industry knowledge

---

## Cross-Skill Delegation

- For detailed backlink comparison, defer to the `seo-backlinks` skill
- For content quality comparison, defer to the `seo-content` skill
- For technical SEO comparison, defer to the `seo-technical` skill
- For schema markup comparison, defer to the `seo-schema` skill
- For competitor comparison page creation, defer to the `seo-competitor-pages` skill

---

## Output Format

### Competitive Analysis Score: XX/100

### Competitor Overview
| Domain | DR | Organic Keywords | Traffic Est. | Backlinks |
|--------|----|-----------------:|-------------:|----------:|
| Client: example.com | XX | XX | XX | XX |
| Comp 1: competitor1.com | XX | XX | XX | XX |
| Comp 2: competitor2.com | XX | XX | XX | XX |
| Comp 3: competitor3.com | XX | XX | XX | XX |

### Gap Category Breakdown
| Category | Weight | Score | Status |
|----------|--------|-------|--------|
| Keyword Gap | 25% | XX/100 | ✅/⚠️/❌ |
| Content Gap | 25% | XX/100 | ✅/⚠️/❌ |
| Backlink Gap | 20% | XX/100 | ✅/⚠️/❌ |
| SERP Feature Gap | 15% | XX/100 | ✅/⚠️/❌ |
| Technical Benchmark | 15% | XX/100 | ✅/⚠️/❌ |

### Top Keyword Opportunities
| Keyword | Volume | Difficulty | Competitor Ranking | Client Ranking |
|---------|-------:|-----------:|-------------------:|---------------:|
| keyword 1 | XX | XX | #X | Not ranking |
| keyword 2 | XX | XX | #X | #XX |

### Content Gap Priorities
1. [Missing content type/topic with highest opportunity]
2. [Next priority content gap]
3. [Additional gap]

### Backlink Acquisition Targets
| Domain | DR | Links to Competitors | Relevance |
|--------|----|--------------------|-----------|
| domain1.com | XX | 3/3 competitors | High |
| domain2.com | XX | 2/3 competitors | Medium |

### SERP Feature Opportunities
- [Specific SERP features to target with implementation guidance]

### Critical Issues (fix immediately)
### High Priority (fix within 1 week)
### Medium Priority (fix within 1 month)
### Low Priority (backlog)

### Strategic Recommendations
1. [Highest-impact competitive action]
2. [Next priority action]
3. [Additional recommendation]
