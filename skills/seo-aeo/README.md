# seo-aeo — Quick Reference

Real Answer Engine Optimization for the Seona stack: multi-LLM citation
tracking, technical artifact generation, and a branded German client report.

## Setup (one-time)

```sh
cd web
npm install
```

For live tracking (not required for `--dry-run`):

```sh
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_API_KEY="..."        # or GEMINI_API_KEY
```

Optional model overrides:

```sh
export AEO_OPENAI_MODEL="gpt-4o-mini"
export AEO_ANTHROPIC_MODEL="claude-sonnet-4-6"
export AEO_GEMINI_MODEL="gemini-2.0-flash"
```

## First run on a new domain (interactive, recommended)

```sh
cd web

# 1. Initialize brand config
npx tsx lib/aeo/cli.ts init-config bitsandbond.com \
  --brand "Bits & Bond" --lang de \
  --competitors "phantomstudio.com,hellovelocity.com,studioresort.com" \
  --accent "#e05a33"

# 2. Generate prompt candidates (use --dry-run to save the suggest call)
npx tsx lib/aeo/cli.ts suggest-prompts bitsandbond.com --dry-run
# → review prompts in output/bitsandbond.com/aeo/prompts.json, edit if needed

# 3. Tracking run (live; estimate $3–5)
npx tsx lib/aeo/cli.ts run bitsandbond.com --samples 3 --max-spend 5

# 4. Score + competitor suggest
npx tsx lib/aeo/cli.ts score bitsandbond.com
npx tsx lib/aeo/cli.ts suggest bitsandbond.com

# 5. Artifacts (llms.txt, robots-patch, JSON-LD, E-E-A-T)
npx tsx lib/aeo/cli.ts artifacts bitsandbond.com

# 6. Branded report (HTML + PDF)
npx tsx lib/aeo/cli.ts report bitsandbond.com --lang de
```

## Dry-run on the same domain (zero API cost, deterministic)

```sh
cd web
npx tsx lib/aeo/cli.ts init-config bitsandbond.com \
  --brand "Bits & Bond" --lang de --competitors "phantomstudio.com,hellovelocity.com,studioresort.com"
npx tsx lib/aeo/cli.ts suggest-prompts bitsandbond.com --dry-run
npx tsx lib/aeo/cli.ts run bitsandbond.com --dry-run
npx tsx lib/aeo/cli.ts artifacts bitsandbond.com --skip-scrape
npx tsx lib/aeo/cli.ts report bitsandbond.com --lang de
```

## Outputs

```
output/<domain>/aeo/
├─ config.json            Brand config (logo, accent, competitors, language)
├─ prompts.json           Approved tracking prompts
├─ runs/<ts>.json         Individual run dumps (append-only)
├─ latest.json            Most recent run
├─ recommendations.json   Competitor gap suggestions (from `suggest`)
├─ report.html            Self-contained branded HTML report
├─ report.pdf             A4 PDF (Playwright-rendered)
└─ artifacts/
   ├─ llms.txt            Deploy to /llms.txt at domain root
   ├─ robots-patch.diff   Apply with `patch robots.txt < robots-patch.diff`
   ├─ robots-proposed.txt Full proposed robots.txt (alternative)
   ├─ schema.jsonld       <script> blocks for Organization/Person/Article
   ├─ eeat-recommendations.md  Prioritized E-E-A-T action items
   └─ index.json          Summary of generated artifacts
```

## Cost guard

The runner enforces `--max-spend` (default `$20`). If exceeded mid-run the
partial run is still persisted.

Typical real costs:

| Mix | Calls | Estimate |
|---|---|---|
| OpenAI + Anthropic (mini/sonnet) | 60 (10 × 3 × 2) | $3–5 |
| Three providers (incl. Gemini) | 90 | $4–7 |
| + Competitor suggest (5 gaps) | +5 | + $0.30 |

## Notes

- Brand citation detection is case-insensitive with word boundaries. Add
  `aliases: ["B&B", "bits-and-bond"]` to the config if your brand is referenced
  by multiple spellings.
- Competitor scraping respects robots.txt. Pages blocked are reported but not
  fetched.
- Scraped content is wrapped in untrusted delimiters before being sent to the
  LLM for gap analysis — prompt-injection-resistant.
- Reports are non-deterministic — re-running the same prompts can yield ±15%
  citation-rate variance. Use ≥3 samples to smooth this.
- See `references/interpretation-guide.md` for how to read scores.
- See `references/prompt-templates.md` for industry-specific prompt seeds.
