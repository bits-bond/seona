---
name: seo-keywords
description: >
  Keyword research and opportunity mapping. Identifies target keywords from
  page content analysis, provides search volume and difficulty data when MCP
  is available (Ahrefs, Semrush, or kwrds.ai), clusters keywords by topic
  and intent, identifies low-hanging fruit opportunities (positions 4-20),
  and generates content brief suggestions. Use when user says "keyword research",
  "keywords", "keyword analysis", "keyword opportunities", "content brief",
  "keyword gap", "search volume", "keyword difficulty", "low-hanging fruit",
  or "keyword mapping".
---

# Keyword Research & Opportunity Mapping

## MCP Data Source Detection

Before analysis, check for available keyword data MCP tools. Prefer in this order:

### 1. Ahrefs MCP (`@ahrefs/mcp`)
If available, use Keywords Explorer endpoints:
- **Search volume**: Monthly search volume with trend data
- **Keyword difficulty**: KD score (0-100)
- **SERP features**: Featured snippets, PAA, knowledge panels
- **Click metrics**: Clicks per search, click-through distribution
- **Related keywords**: Also rank for, questions, suggestions

### 2. Semrush MCP
If available, use Keyword Analytics endpoints:
- **Search volume**: Monthly volume with seasonal trends
- **Keyword difficulty**: KD% score
- **CPC data**: Cost per click for commercial intent estimation
- **SERP features**: Which features appear for the keyword
- **Position tracking**: Current rankings if domain provided

### 3. kwrds.ai MCP
If available, use keyword research endpoints:
- **Search volume**: Estimated monthly volume
- **Keyword difficulty**: Competition score
- **Related terms**: Semantically related keywords

### No MCP Available
When no keyword data MCP is configured, perform content-based analysis:
- Extract target keywords from on-page signals (title, H1, H2s, meta description)
- Analyze keyword usage in body content (density, placement, variations)
- Classify search intent from content type and structure
- Identify content gaps from missing subtopics
- Suggest long-tail variations and related topics
- Provide methodology for obtaining volume/difficulty data manually

---

## Keyword Analysis Criteria

### 1. Keyword Targeting Quality (25%)

Evaluate how well the page targets its primary and secondary keywords.

**Strong signals (score 80-100):**
- Primary keyword in title tag, H1, and first paragraph
- Secondary keywords in H2/H3 headings
- Semantic variations and LSI terms present throughout content
- Keyword density in natural range (1-3%)
- No keyword stuffing or unnatural repetition

**Moderate signals (score 50-79):**
- Primary keyword present but not optimally placed
- Some secondary keywords in headings
- Limited semantic variations
- Density slightly outside natural range

**Weak signals (score 0-49):**
- No clear primary keyword target
- Headings lack keyword focus
- Missing semantic variations
- Keyword stuffing or zero keyword presence

### 2. Search Intent Alignment (25%)

Assess whether content type and depth match the likely search intent.

| Intent Type | Content Match | Signals |
|-------------|--------------|---------|
| **Informational** | Guide, tutorial, explainer, wiki | "how to", "what is", "guide", educational tone |
| **Navigational** | Brand/product page, homepage | Brand name, specific product, "login", "official" |
| **Transactional** | Product page, pricing, checkout | "buy", "price", "discount", "order", product schema |
| **Commercial** | Comparison, review, "best of" | "best", "vs", "review", "top", comparison tables |

**Evaluate:**
- Content type matches dominant search intent
- User journey stage is addressed (awareness, consideration, decision)
- Content depth is appropriate for intent (deep for informational, concise for transactional)
- Call-to-action aligns with intent stage

### 3. Keyword Opportunities (20%)

Identify untapped keyword potential.

**With MCP data:**
- Low-hanging fruit: keywords ranking positions 4-20 with >100 monthly searches
- Quick wins: keywords in positions 11-20 that need minor content optimization
- High-value gaps: keywords competitors rank for but target site doesn't
- Long-tail opportunities: low-difficulty keywords with moderate volume
- Question-based keywords: potential featured snippet targets

**Without MCP data:**
- Content gap analysis: subtopics not covered that competitors address
- Long-tail suggestions: based on content analysis and search patterns
- Question-based opportunities: common queries related to the topic
- Semantic gaps: missing related terms and concepts
- Framework for identifying low-hanging fruit using Google Search Console data

### 4. Content Coverage & Gaps (15%)

Measure topical completeness.

**Evaluate:**
- Topic cluster completeness: are all relevant subtopics addressed?
- Missing subtopics vs competitor coverage
- Content freshness: outdated information or stale data
- Semantic coverage breadth: diversity of related terms and concepts
- Internal linking opportunities to strengthen topic clusters

### 5. Competitive Positioning (15%)

Assess realistic ranking potential.

**With MCP data:**
- Keyword difficulty vs estimated site authority
- SERP feature opportunities (featured snippets, PAA, image packs)
- Content differentiation potential vs top-ranking pages
- Market share of target keyword set

**Without MCP data:**
- SERP analysis methodology for manual assessment
- Title tag comparison with top-ranking competitors
- Content depth and format comparison
- Differentiation opportunities from content analysis

---

## Low-Hanging Fruit Detection

### With MCP Data (Positions 4-20)

Identify keywords where the site already ranks but has room to improve:

```
## Low-Hanging Fruit Opportunities

| Keyword | Position | Volume | Difficulty | Opportunity |
|---------|----------|--------|------------|-------------|
| [keyword] | #X | XX/mo | XX | [action needed] |

### Quick Wins (Positions 4-10)
- Already on page 1 — optimize title, meta description, content depth
- Estimated traffic gain: XX-XX clicks/month per position improvement

### Near Misses (Positions 11-20)
- Close to page 1 — needs content expansion, internal links, or backlinks
- Prioritize by volume × (21 - current position) for impact score
```

### Without MCP Data

Provide methodology for finding low-hanging fruit:

1. **Google Search Console**: Filter queries by position 4-20, sort by impressions
2. **Manual SERP check**: Search target keywords, note current position
3. **Content comparison**: Compare page depth/quality vs pages ranking above
4. **Action items**: Specific improvements to gain positions (content additions, internal links, title optimization)

---

## Keyword Clustering

Group identified keywords by topic and intent:

```
## Keyword Clusters

### Cluster 1: [Topic Name]
- **Intent**: [informational/transactional/commercial/navigational]
- **Primary keyword**: [main keyword]
- **Supporting keywords**: [list of related terms]
- **Content recommendation**: [page type and approach]
- **Priority**: [Critical/High/Medium/Low]

### Cluster 2: [Topic Name]
...
```

**Clustering methodology:**
1. Group keywords by semantic similarity
2. Assign search intent to each cluster
3. Map clusters to existing pages (or flag gaps needing new content)
4. Prioritize by volume × relevance × achievability

---

## Content Brief Generation

When generating content briefs for keyword opportunities, use this format:

```
## Content Brief: [Target Keyword]

- **Primary Keyword**: [keyword] (volume: XX, difficulty: XX)
- **Secondary Keywords**: [list]
- **Search Intent**: [informational/transactional/commercial/navigational]
- **Recommended Word Count**: [range based on SERP analysis or content type]
- **Suggested Structure**:
  - H1: [suggested title]
  - H2s: [suggested sections]
- **Topics to Cover**: [bulleted list]
- **Questions to Answer**: [from People Also Ask / related queries]
- **Internal Links to Include**: [relevant existing pages]
```

**Word count guidance by content type:**
| Content Type | Suggested Range | Basis |
|-------------|----------------|-------|
| Blog post / guide | 1,500-3,000 | Topical coverage depth |
| Product page | 300-800 | Feature/benefit coverage |
| Service page | 800-1,500 | Service detail depth |
| Comparison page | 1,500-2,500 | Thorough comparison |
| FAQ / resource | 1,000-2,000 | Question coverage |

> **Note:** Word count targets are based on topical coverage requirements, not an SEO ranking factor. The goal is thorough coverage of the topic, not hitting a word count target.

**Brief generation rules:**
- Generate briefs for top 3-5 keyword opportunities
- Prioritize by search volume, difficulty, and business relevance
- Include specific heading suggestions that incorporate target keywords
- List questions to answer sourced from PAA data (if MCP available) or topic analysis
- Suggest internal linking targets from existing site content

---

## Output Format

### Keyword Analysis Score: XX/100

### Score Breakdown

| Category | Weight | Score | Details |
|----------|--------|-------|---------|
| Keyword Targeting Quality | 25% | XX/25 | ... |
| Search Intent Alignment | 25% | XX/25 | ... |
| Keyword Opportunities | 20% | XX/20 | ... |
| Content Coverage & Gaps | 15% | XX/15 | ... |
| Competitive Positioning | 15% | XX/15 | ... |

### Data Source
- MCP: [Ahrefs / Semrush / kwrds.ai / None — content-based analysis]

### Current Keyword Targets
| Keyword | Location | Density | Intent |
|---------|----------|---------|--------|
| [keyword] | Title, H1, body | X.X% | [type] |

### Keyword Clusters
[Clustered keyword groups with intent and priority]

### Low-Hanging Fruit
[Opportunities at positions 4-20 or methodology for finding them]

### Content Briefs
[Top 3-5 opportunity briefs]

### Critical Issues (fix immediately)
### High Priority (fix within 1 week)
### Medium Priority (fix within 1 month)
### Low Priority (backlog)

---

## Cross-Skill References

- **seo-content**: Keyword optimization ties into content quality assessment — keyword targeting quality overlaps with content E-E-A-T evaluation
- **seo-geo**: AI citation readiness depends on proper keyword targeting and content structure
- **seo-competitor-pages**: Competitor comparison pages benefit from keyword gap analysis
- **seo-programmatic**: Programmatic pages need keyword mapping to prevent cannibalization
