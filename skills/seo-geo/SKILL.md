---
name: seo-geo
description: >
  Optimize content for AI Overviews (formerly SGE), ChatGPT web search,
  Perplexity, and other AI-powered search experiences. Generative Engine
  Optimization (GEO) analysis including brand mention signals, AI crawler
  accessibility, llms.txt compliance, passage-level citability scoring, and
  platform-specific optimization. Use when user says "AI Overviews", "SGE",
  "GEO", "AI search", "LLM optimization", "Perplexity", "AI citations",
  "ChatGPT search", or "AI visibility".
---

# AI Search / GEO Optimization (February 2026)

## Key Statistics

| Metric | Value | Source |
|--------|-------|--------|
| AI Overviews reach | 1.5 billion users/month across 200+ countries | Google |
| AI Overviews query coverage | 50%+ of all queries | Industry data |
| AI-referred sessions growth | 527% (Jan-May 2025) | SparkToro |
| ChatGPT weekly active users | 900 million | OpenAI |
| Perplexity monthly queries | 500+ million | Perplexity |

## Critical Insight: Brand Mentions > Backlinks

**Brand mentions correlate 3× more strongly with AI visibility than backlinks.**
(Ahrefs December 2025 study of 75,000 brands)

| Signal | Correlation with AI Citations |
|--------|------------------------------|
| YouTube mentions | ~0.737 (strongest) |
| Reddit mentions | High |
| Wikipedia presence | High |
| LinkedIn presence | Moderate |
| Domain Rating (backlinks) | ~0.266 (weak) |

**Only 11% of domains** are cited by both ChatGPT and Google AI Overviews for the same query — platform-specific optimization is essential.

---

## GEO Analysis Criteria (Updated)

### 1. Citability Score (25%)

**Optimal passage length: 134-167 words** for AI citation.

**Strong signals:**
- Clear, quotable sentences with specific facts/statistics
- Self-contained answer blocks (can be extracted without context)
- Direct answer in first 40-60 words of section
- Claims attributed with specific sources
- Definitions following "X is..." or "X refers to..." patterns
- Unique data points not found elsewhere

**Weak signals:**
- Vague, general statements
- Opinion without evidence
- Buried conclusions
- No specific data points

### 2. Structural Readability (20%)

**92% of AI Overview citations come from top-10 ranking pages**, but 47% come from pages ranking below position 5 — demonstrating different selection logic.

**Strong signals:**
- Clean H1→H2→H3 heading hierarchy
- Question-based headings (matches query patterns)
- Short paragraphs (2-4 sentences)
- Tables for comparative data
- Ordered/unordered lists for step-by-step or multi-item content
- FAQ sections with clear Q&A format

**Weak signals:**
- Wall of text with no structure
- Inconsistent heading hierarchy
- No lists or tables
- Information buried in paragraphs

### 3. Multi-Modal Content (15%)

Content with multi-modal elements sees **156% higher selection rates**.

**Check for:**
- Text + relevant images
- Video content (embedded or linked)
- Infographics and charts
- Interactive elements (calculators, tools)
- Structured data supporting media

### 4. Authority & Brand Signals (20%)

**Strong signals:**
- Author byline with credentials
- Publication date and last-updated date
- Citations to primary sources (studies, official docs, data)
- Organization credentials and affiliations
- Expert quotes with attribution
- Entity presence in Wikipedia, Wikidata
- Mentions on Reddit, YouTube, LinkedIn

**Weak signals:**
- Anonymous authorship
- No dates
- No sources cited
- No brand presence across platforms

### 5. Technical Accessibility (20%)

**AI crawlers do NOT execute JavaScript** — server-side rendering is critical.

**Check for:**
- Server-side rendering (SSR) vs client-only content
- AI crawler access in robots.txt
- llms.txt file presence and configuration
- RSL 1.0 licensing terms

---

## AI Crawler Detection

Check `robots.txt` for these AI crawlers:

| Crawler | Owner | Purpose |
|---------|-------|---------|
| GPTBot | OpenAI | ChatGPT web search |
| OAI-SearchBot | OpenAI | OpenAI search features |
| ChatGPT-User | OpenAI | ChatGPT browsing |
| ClaudeBot | Anthropic | Claude web features |
| PerplexityBot | Perplexity | Perplexity AI search |
| CCBot | Common Crawl | Training data (often blocked) |
| anthropic-ai | Anthropic | Claude training |
| Bytespider | ByteDance | TikTok/Douyin AI |
| cohere-ai | Cohere | Cohere models |

**Recommendation:** Allow GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot for AI search visibility. Block CCBot and training crawlers if desired.

---

## llms.txt Standard

The emerging **llms.txt** standard provides AI crawlers with structured content guidance.

**Location:** `/llms.txt` (root of domain)

**Format:**
```
# Title of site
> Brief description

## Main sections
- [Page title](url): Description
- [Another page](url): Description

## Optional: Key facts
- Fact 1
- Fact 2
```

**Check for:**
- Presence of `/llms.txt`
- Structured content guidance
- Key page highlights
- Contact/authority information

---

## RSL 1.0 (Really Simple Licensing)

New standard (December 2025) for machine-readable AI licensing terms.

**Backed by:** Reddit, Yahoo, Medium, Quora, Cloudflare, Akamai, Creative Commons

**Check for:** RSL implementation and appropriate licensing terms.

---

## Platform-Specific Optimization

| Platform | Key Citation Sources | Optimization Focus |
|----------|---------------------|-------------------|
| **Google AI Overviews** | Top-10 ranking pages (92%) | Traditional SEO + passage optimization |
| **ChatGPT** | Wikipedia (47.9%), Reddit (11.3%) | Entity presence, authoritative sources |
| **Perplexity** | Reddit (46.7%), Wikipedia | Community validation, discussions |
| **Bing Copilot** | Bing index, authoritative sites | Bing SEO, IndexNow |

---

## Output

Generate `GEO-ANALYSIS.md` with:

1. **GEO Readiness Score: XX/100**
2. **Platform breakdown** (Google AIO, ChatGPT, Perplexity scores)
3. **AI Crawler Access Status** (which crawlers allowed/blocked)
4. **llms.txt Status** (present, missing, recommendations)
5. **Brand Mention Analysis** (presence on Wikipedia, Reddit, YouTube, LinkedIn)
6. **Passage-Level Citability** (optimal 134-167 word blocks identified)
7. **Server-Side Rendering Check** (JavaScript dependency analysis)
8. **Top 5 Highest-Impact Changes**
9. **Schema Recommendations** (for AI discoverability)
10. **Content Reformatting Suggestions** (specific passages to rewrite)

---

## Quick Wins

1. Add "What is [topic]?" definition in first 60 words
2. Create 134-167 word self-contained answer blocks
3. Add question-based H2/H3 headings
4. Include specific statistics with sources
5. Add publication/update dates
6. Implement Person schema for authors
7. Allow key AI crawlers in robots.txt

## Medium Effort

1. Create `/llms.txt` file
2. Add author bio with credentials + Wikipedia/LinkedIn links
3. Ensure server-side rendering for key content
4. Build entity presence on Reddit, YouTube
5. Add comparison tables with data
6. Implement FAQ sections (structured, not schema for commercial sites)

## High Impact

1. Create original research/surveys (unique citability)
2. Build Wikipedia presence for brand/key people
3. Establish YouTube channel with content mentions
4. Implement comprehensive entity linking (sameAs across platforms)
5. Develop unique tools or calculators

---

## Brand Mention Analysis

Brand mentions across AI platforms correlate 3× more strongly with AI citations than backlinks. Systematic brand mention analysis is essential for GEO strategy.

### Query Methodology

Search AI platforms using these query patterns to assess brand visibility:

| Query Pattern | Purpose | Example |
|---------------|---------|---------|
| `"[brand name]"` | Direct brand awareness | "Watchmen Security" |
| `"[brand] + [industry]"` | Category association | "Watchmen cybersecurity" |
| `"[competitor] alternatives"` | Competitive positioning | "CrowdStrike alternatives" |
| `"best [category] [year]"` | Category leadership | "best cybersecurity consulting 2026" |
| `"[brand] vs [competitor]"` | Head-to-head comparison | "Watchmen vs CrowdStrike" |
| `"[brand] review"` | Reputation signals | "Watchmen Security review" |

### Platforms to Query

Run each query pattern across these platforms and record results:

1. **Google AI Overviews** — Search the query on Google, note if brand appears in AI Overview
2. **ChatGPT** — Ask ChatGPT the query, note mention context (recommendation, neutral mention, or absent)
3. **Perplexity** — Search Perplexity, note citation source and mention context
4. **Bing Copilot** — Search Bing, note Copilot mention and source

### Scoring Factors

| Factor | Weight | Assessment |
|--------|--------|------------|
| Mention frequency | 30% | How often brand appears across queries |
| Context quality | 25% | Recommendation vs neutral mention vs negative |
| Platform breadth | 25% | Number of platforms mentioning the brand |
| Source diversity | 20% | Variety of sources citing the brand (Wikipedia, Reddit, news, etc.) |

### Brand Mention Score: XX/100

| Range | Rating | Interpretation |
|-------|--------|----------------|
| 80-100 | Excellent | Strong AI visibility across platforms |
| 60-79 | Good | Visible on most platforms, room for improvement |
| 40-59 | Fair | Inconsistent presence, significant gaps |
| 20-39 | Poor | Minimal AI visibility |
| 0-19 | Critical | Virtually invisible to AI platforms |

### Cross-Platform Comparison Matrix

| Query | Google AIO | ChatGPT | Perplexity | Bing Copilot |
|-------|-----------|---------|------------|--------------|
| [brand name] | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| [brand] + [industry] | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| [competitor] alternatives | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| best [category] | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

---

## Share of Voice (AI Platforms)

Share of Voice (SOV) measures brand presence relative to competitors in AI-generated answers.

### Definition

**AI Share of Voice** = (brand mentions / total category mentions) across AI platforms for key queries.

### Tracking Methodology

1. **Define category queries**: Identify 10-20 key queries in the brand's domain (e.g., "best [category]", "[industry] tools", "how to [task]")
2. **Query all platforms**: Run each query across Google AIO, ChatGPT, Perplexity, Bing Copilot
3. **Record mentions**: Note which brands are mentioned in each AI-generated answer
4. **Calculate SOV**: For each query, count brand mentions vs total brand mentions across all competitors

### SOV Calculation

```
SOV = (Your Brand Mentions / Total Brand Mentions in Category) × 100

Example:
- Query: "best cybersecurity consulting firms"
- Total brands mentioned across all platforms: 20 mentions
- Your brand mentioned: 5 times
- SOV = 5/20 = 25%
```

### Competitor Comparison Framework

Track SOV against top 3-5 competitors:

| Brand | Google AIO | ChatGPT | Perplexity | Overall SOV | Trend |
|-------|-----------|---------|------------|-------------|-------|
| [Your Brand] | XX% | XX% | XX% | XX% | ↑/→/↓ |
| [Competitor 1] | XX% | XX% | XX% | XX% | ↑/→/↓ |
| [Competitor 2] | XX% | XX% | XX% | XX% | ↑/→/↓ |
| [Competitor 3] | XX% | XX% | XX% | XX% | ↑/→/↓ |

### Trend Indicators

| Indicator | Meaning | Action |
|-----------|---------|--------|
| ↑ Growing | SOV increased over tracking period | Maintain current strategy |
| → Stable | SOV unchanged | Identify growth opportunities |
| ↓ Declining | SOV decreased over tracking period | Investigate competitor gains, adjust strategy |

### SOV Improvement Strategies

1. **Increase entity presence**: Wikipedia, Wikidata, LinkedIn, YouTube
2. **Earn community mentions**: Reddit discussions, forum presence, Quora answers
3. **Produce citable content**: Original research, unique data, expert insights
4. **Optimize for each platform**: Platform-specific content strategies (see Platform-Specific Optimization section above)

---

## llms.txt Generator

The `/llms.txt` file provides AI crawlers with structured content guidance about your site. This section generates a complete, ready-to-deploy `llms.txt` file based on site analysis.

### Generation Process

1. **Analyze site structure**: Crawl homepage, about page, key content pages
2. **Extract site identity**: Name, description, core offerings
3. **Identify key content**: Top pages by importance (services, products, resources)
4. **Map contact/authority info**: Contact details, social profiles, credentials
5. **Generate formatted output**: Produce valid llms.txt content

### llms.txt Format Specification

```
# [Site Name]

> [One-line description of the site/company — concise, factual, keyword-rich]

## About
[2-3 paragraphs about the site/company. Include:
- What the company does
- Key differentiators
- Industry/market focus
- Notable credentials or achievements]

## Key Content
- [URL]: [Description of page content and value]
- [URL]: [Description of page content and value]
- [URL]: [Description of page content and value]
[List 10-20 most important pages]

## Products/Services
- [Product/Service 1]: [Brief description]
- [Product/Service 2]: [Brief description]

## FAQ
- [Common question 1]: [Concise answer]
- [Common question 2]: [Concise answer]

## Contact
- Website: [URL]
- Email: [Email]
- Phone: [Phone]
- Address: [Address]

## Social
- LinkedIn: [URL]
- Twitter/X: [URL]
- YouTube: [URL]
- GitHub: [URL]
```

### Content Optimization for AI Understanding

When generating llms.txt content:
- Use factual, specific language (not marketing fluff)
- Include quantifiable claims where available ("200+ enterprise clients", "since 2018")
- Structure descriptions for extractability — each line should be self-contained
- Prioritize pages by citation value (resource pages, guides, data-driven content)
- Include entity relationships (industry, location, partnerships)

### Deployment Instructions

Output should include:
1. Complete `llms.txt` file content ready to save
2. Deployment path: place at domain root (`/llms.txt`)
3. Verification: access via `https://[domain]/llms.txt`
4. robots.txt addition: `Allow: /llms.txt` (ensure AI crawlers can access it)

---

## Citation Optimization

AI platforms cite passages that are specific, self-contained, and fact-first. This section identifies content that COULD be cited but isn't structured optimally, and provides concrete before/after rewrites.

### Optimal Citation Structure

**Target passage length: 134-167 words** — this is the sweet spot for AI citation extraction.

### Citation Patterns That Work

| Pattern | Description | Example |
|---------|-------------|---------|
| Fact-first | Lead with the specific fact or data point | "Since 2018, Watchmen has..." |
| Definition | Clear "X is..." or "X refers to..." format | "Zero-trust architecture is a security model that..." |
| Quantified claim | Include specific numbers | "200+ enterprise clients across 12 countries" |
| Attribution | Name the source of claims | "According to Gartner's 2025 report..." |
| Self-contained | Passage makes sense without surrounding context | Complete answer in one paragraph |

### Before/After Rewrite Examples

**Example 1 — Vague to Specific:**
- **Before:** "We have extensive experience in cybersecurity consulting."
- **After:** "Since 2018, Watchmen has delivered zero-trust security consulting to 200+ enterprise clients including ASML, ABN AMRO, and the Dutch Ministry of Defence, achieving a 99.7% incident prevention rate across managed environments."

**Example 2 — Buried Conclusion to Fact-First:**
- **Before:** "There are many factors to consider when choosing a security framework, and after careful analysis of industry trends and requirements, we believe that zero-trust is the most effective approach."
- **After:** "Zero-trust architecture reduces breach risk by 68% compared to perimeter-based security (Forrester, 2025). It eliminates implicit trust by verifying every user, device, and connection — making it the recommended framework for organizations handling sensitive data."

**Example 3 — Generic to Quotable:**
- **Before:** "Our team is highly skilled and experienced in their field."
- **After:** "Watchmen's 45-person security team holds 120+ active certifications including CISSP, CISM, and OSCP, with an average of 12 years of hands-on penetration testing experience across financial services, healthcare, and government sectors."

**Example 4 — Opinion to Evidence-Based:**
- **Before:** "AI is transforming the cybersecurity landscape in many ways."
- **After:** "AI-powered threat detection identifies 95% of zero-day exploits within 4 hours of emergence, compared to 12-24 hours for signature-based systems (IBM X-Force, 2025). Three key applications are driving this shift: automated log analysis, behavioral anomaly detection, and predictive vulnerability scoring."

### Rewrite Checklist

When optimizing passages for AI citation:
- [ ] Passage is 134-167 words (optimal citation length)
- [ ] Leads with specific fact, statistic, or definition
- [ ] Includes at least one quantified claim
- [ ] Self-contained — makes sense extracted from context
- [ ] Attributes claims to specific sources
- [ ] Uses concrete nouns and active voice
- [ ] Contains unique data points not found elsewhere
- [ ] Avoids hedging language ("may", "could", "might")

### Content Audit for Citability

For each key page, identify:
1. **High-potential passages**: Content that answers common queries but needs restructuring
2. **Missing fact density**: Sections with claims but no supporting data
3. **Buried answers**: Conclusions hidden in mid-paragraph or at end of long sections
4. **Generic statements**: Content that could apply to any company — needs specificity

---

## AI Crawler Monitoring

Expanded guidance on analyzing server access logs for AI crawler activity patterns.

### Log Analysis Methodology

AI crawlers leave distinct patterns in server access logs. Monitoring these patterns reveals which AI platforms are indexing your content.

### Key Crawler User-Agent Strings

| Crawler | User-Agent Pattern | Owner |
|---------|-------------------|-------|
| GPTBot | `GPTBot/1.0` or `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0)` | OpenAI |
| OAI-SearchBot | `OAI-SearchBot` | OpenAI |
| ChatGPT-User | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ChatGPT-User/1.0)` | OpenAI |
| ClaudeBot | `ClaudeBot/1.0` | Anthropic |
| PerplexityBot | `PerplexityBot/1.0` | Perplexity |
| Bytespider | `Bytespider` | ByteDance |
| CCBot | `CCBot/2.0` | Common Crawl |
| cohere-ai | `cohere-ai` | Cohere |

### Log Analysis Commands

**Apache/Nginx access logs — identify AI crawler visits:**
```bash
# Count visits per AI crawler
grep -E "GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|PerplexityBot|Bytespider|CCBot|cohere-ai" access.log | \
  awk '{print $1}' | sort | uniq -c | sort -rn

# Top pages crawled by AI bots
grep -E "GPTBot|ClaudeBot|PerplexityBot" access.log | \
  awk '{print $7}' | sort | uniq -c | sort -rn | head -20

# Crawl frequency by day
grep "GPTBot" access.log | \
  awk '{print $4}' | cut -d: -f1 | tr -d '[' | sort | uniq -c

# Response codes returned to AI crawlers
grep -E "GPTBot|ClaudeBot|PerplexityBot" access.log | \
  awk '{print $9}' | sort | uniq -c | sort -rn
```

### Monitoring Metrics

| Metric | What to Track | Why It Matters |
|--------|---------------|----------------|
| Crawl frequency | Visits per day/week per crawler | Indicates indexing priority |
| Pages crawled | Which URLs each crawler visits | Shows what content AI values |
| Response codes | 200, 301, 403, 404, 503 rates | Ensures content is accessible |
| Crawl depth | How deep into site structure | Shows discovery patterns |
| New vs return | First visit vs re-crawl | Indicates content freshness signals |

### Status Dashboard

| Crawler | Last Seen | Pages/Week | Top Pages | Status |
|---------|-----------|------------|-----------|--------|
| GPTBot | [date] | [count] | [URLs] | ✅ Active / ❌ Blocked / ⚠️ No visits |
| ClaudeBot | [date] | [count] | [URLs] | ✅ Active / ❌ Blocked / ⚠️ No visits |
| PerplexityBot | [date] | [count] | [URLs] | ✅ Active / ❌ Blocked / ⚠️ No visits |
| OAI-SearchBot | [date] | [count] | [URLs] | ✅ Active / ❌ Blocked / ⚠️ No visits |

### Actionable Insights

Based on log analysis, provide:
1. **Access status**: Which AI crawlers are actively visiting (and which are blocked or absent)
2. **Content preferences**: Which pages AI crawlers visit most frequently — these are high-citation-potential pages
3. **Error patterns**: Any 403/404/503 responses that block AI crawlers from content
4. **Recommendations**:
   - Unblock AI crawlers returning 403 (check robots.txt rules)
   - Fix 404s on pages AI crawlers attempt to access
   - Ensure high-value content pages are accessible (200 status)
   - Add internal links to pages AI crawlers haven't discovered
5. **robots.txt alignment**: Compare robots.txt rules against actual crawler behavior
