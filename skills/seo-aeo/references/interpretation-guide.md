# Interpreting the AI Visibility Score

The AEO report produces a single 0–100 score with several supporting metrics.
This guide explains how to read them and what to recommend.

## Overall Score Bands

| Range | Rating | Typical Meaning |
|---|---|---|
| 80–100 | Excellent | Brand is consistently cited across providers; competitors don't out-cite you on category queries. Focus on protective moats (Wikipedia, original research). |
| 60–79 | Good | Visible but with platform-specific gaps. Often: strong on one provider (e.g. Anthropic), weak on another (e.g. Gemini). |
| 40–59 | Fair | Brand exists in the LLM training data but is not the first/preferred citation. Competitors lead on multiple prompts. |
| 20–39 | Poor | Citations only on direct brand queries ("X review"). Category queries don't surface the brand. |
| 0–19 | Critical | The LLM doesn't know about you in any meaningful sense. Treat this as a baseline — first run will be like this for most small DACH brands. |

## Metric Definitions

- **Brand citation rate**: Across all calls (prompt × provider × sample), what fraction mentioned your brand or linked to your domain? 100 % means every call cited you.
- **Top competitor rate**: Highest citation rate among configured competitors.
- **Gap (in points)**: `(top_competitor_rate − brand_rate) × 100`. A 30-point gap is significant; >50 is a structural problem.
- **Per-provider**: Citation rate broken down by OpenAI, Anthropic, Gemini. Use to detect platform-specific weaknesses (e.g. Anthropic indexes Wikipedia heavily, Gemini favors Reddit-style discussions).

## Where to Focus Recommendations

| Symptom | Probable Cause | Recommended Action |
|---|---|---|
| Brand rate 0 % on category queries, fine on direct queries | LLMs don't associate your brand with the category | Publish category-defining content + claim Wikipedia entity |
| Anthropic rate ≫ Gemini rate | Strong Wikipedia/long-form authority; weak community signal | Build Reddit/Indie Hackers/YouTube presence |
| Gemini rate ≫ Anthropic rate | Strong recent web signals; weak entity establishment | Wikidata + Wikipedia + sameAs schema |
| OpenAI rate ≫ both others | Strong recent press / training overlap | Hold; diversify entity establishment so it's resilient |
| Top competitor on 1 prompt with 100 %, you on 0 % | Competitor owns a passage type | Read their cited URL, write a *better* version under your domain |
| Gap > 50 on multiple prompts | Structural visibility deficit | Combine: schema, llms.txt, original research, community presence |

## What NOT to Promise the Client

- LLM responses are non-deterministic. The same prompt run twice can have ±15 % citation-rate variance. Always run with ≥3 samples to smooth this.
- Citations don't equal traffic. A high score doesn't mean revenue follows immediately; track real referral analytics (e.g. ?utm_source=chatgpt) alongside.
- Re-runs in 4 weeks. AEO is a long game — LLM crawl/training cycles for content take 4–12 weeks before changes propagate.

## Suggested Cadence for Paid Service

1. **Baseline run** at engagement start
2. **Technical artifacts implemented** within 2 weeks (llms.txt, robots, schema)
3. **Content fixes** based on competitor-suggest within 4 weeks
4. **Re-run** at week 8 to measure delta
5. **Quarterly tracking** thereafter (cost: ~$5/run = $20/year)
