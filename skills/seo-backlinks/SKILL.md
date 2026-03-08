---
name: seo-backlinks
description: >
  Backlink profile analysis covering referring domain quality, toxic link
  detection, anchor text distribution, link velocity assessment, page-level
  link distribution, and disavow file generation guidance. Supports optional
  Ahrefs/Semrush MCP integration for enriched data; without MCP, provides
  framework analysis from crawlable on-page link data. Use when user says
  "backlinks", "link profile", "referring domains", "toxic links", "anchor
  text", "disavow", or "link building".
---

# Backlink Profile Analysis

## MCP Integration

### When Ahrefs/Semrush MCP IS Available

Use MCP tool calls for enriched data:
- `mcp__ahrefs__get_backlinks` — Referring domains, Domain Rating, link types
- `mcp__ahrefs__get_anchors` — Anchor text distribution
- `mcp__ahrefs__get_referring_domains` — Domain-level metrics
- `mcp__semrush__backlinks_overview` — Backlink totals, referring domains
- `mcp__semrush__backlinks_refdomains` — Referring domain details

### When MCP is NOT Available

Analyze crawlable link data from the page HTML:
1. Run `scripts/analyze_backlinks.py` on fetched HTML to extract all `<a>` tags
2. Classify internal vs external links, follow vs nofollow
3. Analyze anchor text patterns from on-page links
4. Inspect outbound link quality as a proxy for link profile health
5. Check for reciprocal link patterns

**Note to user:** "External backlink data (referring domains, Domain Rating, link velocity) requires Ahrefs or Semrush MCP integration. The analysis below is based on on-page link inspection."

---

## Backlink Analysis Criteria

### 1. Referring Domain Quality (30%)

**With MCP data:**
- Domain Rating/Authority distribution (DR 0-30, 30-60, 60-100 buckets)
- Topical relevance of referring domains to client's niche
- Geographic relevance (country distribution)
- Link freshness: ratio of links gained in last 90 days vs total

**Without MCP data:**
- Analyze outbound links on client pages — are they linking to high-quality sites?
- Check for reciprocal link footprints in on-page external links
- Identify potential link partners from existing outbound links
- Assess internal link equity distribution

**Scoring:**
| Indicator | Good | Needs Improvement | Poor |
|-----------|------|-------------------|------|
| DR distribution | 50%+ above DR 30 | 30-50% above DR 30 | <30% above DR 30 |
| Topical relevance | >60% relevant | 30-60% relevant | <30% relevant |
| Link freshness | Steady growth | Stagnant | Declining |
| Geographic match | Matches target market | Partially matches | Mismatched |

### 2. Anchor Text Profile (20%)

**Healthy anchor text distribution:**
| Anchor Type | Target Range | Red Flag |
|-------------|-------------|----------|
| Branded | 40-60% | <20% |
| Exact match keyword | 1-5% | >5% (over-optimization) |
| Partial match keyword | 5-15% | >20% |
| Generic (click here, etc.) | 10-20% | >30% |
| Naked URL | 10-20% | >30% |
| Image (no text) | 5-10% | >15% |

**Over-optimization risk assessment:**
- >5% exact match anchor text = moderate risk
- >10% exact match = high risk (potential manual action)
- Sudden shift in anchor text distribution = red flag

**Without MCP:** Analyze anchor text of internal links and outbound links on the page to assess on-page anchor text patterns.

### 3. Toxic Link Assessment (20%)

**Toxic link indicators (with MCP):**
- Links from known PBN (Private Blog Network) patterns
- Sitewide footer/sidebar links from unrelated sites
- Links from link farms (sites with 1000+ outbound links per page)
- Foreign language spam links unrelated to target market
- Links from penalized or deindexed domains
- Paid link footprints (exact match anchors from unrelated sites)

**Penalty risk levels:**
| Risk Level | Indicators | Action |
|------------|-----------|--------|
| Critical | >10% toxic links, manual action warning | Immediate disavow |
| High | 5-10% toxic links, unnatural patterns | Disavow + outreach |
| Medium | 2-5% toxic, some suspicious patterns | Monitor + selective disavow |
| Low | <2% toxic, natural profile | No action needed |

**Without MCP:** Analyze outbound links for spammy patterns (excessive outbound links, irrelevant anchor text, suspicious URL patterns).

### 4. Link Velocity & Trends (15%)

**With MCP data:**
- New links gained per month (last 12 months)
- Links lost per month (last 12 months)
- Net link growth rate
- Sudden spikes or drops (flag >3x average monthly change)

**Velocity assessment:**
| Pattern | Interpretation | Risk |
|---------|---------------|------|
| Steady growth (5-15%/month) | Natural, healthy | Low |
| Sudden spike (>3x average) | Possible link scheme or viral content | Medium-High |
| Sudden drop (>50% loss) | Content removal, penalty, or expired links | High |
| Flat/stagnant | No active link building | Medium |
| Declining trend | Losing links faster than gaining | High |

**Without MCP:** Note that link velocity analysis requires historical backlink data from Ahrefs or Semrush.

### 5. Page-Level Link Distribution (15%)

**With MCP data:**
- Top 10 most-linked pages
- Homepage vs deep page link ratio (healthy: 20-40% homepage)
- Orphan pages (pages with no internal or external links)
- Link equity distribution across site sections

**Without MCP (from crawl data):**
- Internal link count per page from HTML analysis
- Pages with zero internal links (orphan detection)
- Homepage link concentration
- Deep page accessibility (clicks from homepage)

**Scoring:**
| Indicator | Good | Needs Improvement | Poor |
|-----------|------|-------------------|------|
| Homepage ratio | 20-40% | 40-60% | >60% or <10% |
| Orphan pages | <5% | 5-15% | >15% |
| Top page concentration | Top 10 pages <50% of links | 50-70% | >70% |

---

## Disavow File Guidance

When toxic links are identified, provide disavow file generation guidance:

```
# Disavow file for [domain]
# Generated: [date]
# Review each entry before submitting to Google Search Console

# Domain-level disavows (block all links from domain)
domain:spammysite.example.com
domain:linkfarm.example.net

# URL-level disavows (block specific pages)
https://example.com/spammy-page
```

**Best practices:**
1. Always review manually before submitting
2. Prefer domain-level disavows for clearly spammy domains
3. Use URL-level for sites that have some legitimate links
4. Submit via Google Search Console > Links > Disavow Links
5. Allow 2-4 weeks for Google to process
6. Re-evaluate quarterly

---

## Cross-Skill Delegation

- For competitor backlink comparison, defer to the `seo-competitor` skill
- For link-related schema markup (e.g., citations), defer to the `seo-schema` skill
- For content quality of linked pages, defer to the `seo-content` skill

---

## Output Format

### Backlink Profile Score: XX/100

### Profile Overview
| Metric | Value | Status |
|--------|-------|--------|
| Referring Domains | XX | ✅/⚠️/❌ |
| Total Backlinks | XX | ✅/⚠️/❌ |
| Domain Rating | XX | ✅/⚠️/❌ |
| Toxic Link % | XX% | ✅/⚠️/❌ |
| Link Velocity | +XX/month | ✅/⚠️/❌ |

### Category Breakdown
| Category | Weight | Score | Status |
|----------|--------|-------|--------|
| Referring Domain Quality | 30% | XX/100 | ✅/⚠️/❌ |
| Anchor Text Profile | 20% | XX/100 | ✅/⚠️/❌ |
| Toxic Link Assessment | 20% | XX/100 | ✅/⚠️/❌ |
| Link Velocity & Trends | 15% | XX/100 | ✅/⚠️/❌ |
| Page-Level Distribution | 15% | XX/100 | ✅/⚠️/❌ |

### Anchor Text Distribution
| Type | Percentage | Status |
|------|-----------|--------|
| Branded | XX% | ✅/⚠️/❌ |
| Exact Match | XX% | ✅/⚠️/❌ |
| Partial Match | XX% | ✅/⚠️/❌ |
| Generic | XX% | ✅/⚠️/❌ |
| Naked URL | XX% | ✅/⚠️/❌ |

### Top Linked Pages
| Page | Referring Domains | % of Total |
|------|------------------|-----------|
| /page-1 | XX | XX% |
| /page-2 | XX | XX% |

### Critical Issues (fix immediately)
### High Priority (fix within 1 week)
### Medium Priority (fix within 1 month)
### Low Priority (backlog)

### Link Building Opportunities
- [Specific, actionable recommendations based on analysis]

### Disavow Recommendations
- [If toxic links found, provide disavow guidance]
