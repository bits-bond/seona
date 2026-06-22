---
name: seo-aeo
description: >
  Answer Engine Optimization (AEO) — runs real LLM tracking queries against
  ChatGPT/OpenAI, Claude/Anthropic, and Gemini with web search enabled,
  measures brand citation rate vs competitors, generates technical artifacts
  (llms.txt, robots.txt patch, JSON-LD schema, E-E-A-T recommendations),
  and produces a branded German HTML+PDF client report. Use when user says
  "AEO", "Answer Engine Optimization", "AI Visibility", "Citation tracking",
  "AI search ranking", "ChatGPT citations", "Brand mentions in LLMs", or
  invokes `/seo aeo <domain>`.
---

# AEO — Answer Engine Optimization

The AEO skill orchestrates the end-to-end Answer Engine Optimization service:
real LLM citation tracking with multi-provider web search, competitor gap
analysis, technical artifact generation, and a client-ready German report.

## When to invoke

Triggered by `/seo aeo <domain>` or any of the keywords in the description.
Different from `seo-geo` which audits the site for AEO-friendliness — `seo-aeo`
actually asks the LLMs what they say and where they cite.

## End-to-end Flow

The skill runs through these steps. Each step is a separate CLI subcommand so
the user can re-run or skip individual steps.

### 1. Initialize brand config — ASK FIRST, then write

**Critical:** the quality of the entire AEO run depends on accurate brand
context here. Don't fill defaults silently. Ask the user these questions before
calling `init-config`:

1. **Welche Branche?** (Pflicht — wählen aus: `creator-management`,
   `webdesign-agency`, `saas`, `ecommerce`, `local-business`, `publisher`,
   `consulting`, `agency-general`, `other`)
2. **Was macht die Marke konkret?** (1–2 Sätze, wird vom LLM gelesen)
3. **Welche Hauptservices?** (3–7 Stichworte, durch Komma getrennt)
4. **Zielkunde?** (z. B. "TikTok-Creator mit 100k+ Followern",
   "B2B-SaaS-Gründer Seed bis Series A")
5. **Region / Markt?** (Default: DACH)
6. **Wettbewerber?** (3–5 Domains, die der Kunde direkt nennt)
7. **Brand-Aliase?** (verschiedene Schreibweisen, z. B. "Bits & Bond",
   "bits-and-bond", "B&B")
8. **Logo + Akzentfarbe?** (für gebrandetes Report-Layout)

Wenn der User Antworten gibt:

```sh
cd web
npx tsx lib/aeo/cli.ts init-config <domain> \
  --brand "<Brand Name>" \
  --lang de \
  --industry <industry-slug> \
  --description "<1-2 Sätze>" \
  --services "service1,service2,service3" \
  --target-customer "<Zielkunde>" \
  --region "DACH" \
  --competitors "comp1.de,comp2.com,comp3.de" \
  --aliases "alias1,alias2" \
  --logo "/abs/path/logo.png" \
  --accent "#e05a33"
```

Schreibt `output/<domain>/aeo/config.json`. Wenn der User Fragen unbeantwortet
lässt, gehe zur nächsten weiter — der Generator kann mit Lücken umgehen, aber
**Branche ist Pflicht** (sonst landest du im `other`-Fallback).

### 2. Suggest prompts (interactive approval)

```
cd web
npx tsx lib/aeo/cli.ts suggest-prompts <domain> --lang de [--dry-run]
```

Outputs 10 prompt candidates. **Present them to the user inline** and ask:

> Hier sind 10 vorgeschlagene Tracking-Prompts für <Brand>:
> 1. …
> …
> Möchtest du sie so übernehmen, einzelne ändern, oder eine neue Liste generieren?
> (yes / edit / regenerate)

If `edit`: user lists which prompts to replace and provides replacements.
If `regenerate`: rerun with a different seed/temperature.
On approval: write the final list to `output/<domain>/aeo/prompts.json`.

### 3. Run tracking

```
cd web
npx tsx lib/aeo/cli.ts run <domain> \
  --samples 3 \
  --providers openai,anthropic,gemini \
  --max-spend 20 \
  [--dry-run]
```

Required env vars (live mode):
- `OPENAI_API_KEY` — for OpenAI Responses API with web_search
- `ANTHROPIC_API_KEY` — for Anthropic Messages with web_search_20250305
- `GOOGLE_API_KEY` (or `GEMINI_API_KEY`) — for Gemini with googleSearch grounding

If any key is missing, that provider is skipped with a warning (run continues
with the others). `--dry-run` uses fixture responses and costs $0.

Estimated cost: $3–5 with 10 prompts × 3 samples × 3 providers. The
`--max-spend` flag is a hard cap; if exceeded, run aborts and partial results
are persisted.

### 4. Score + competitor suggest

```
cd web
npx tsx lib/aeo/cli.ts score <domain>
npx tsx lib/aeo/cli.ts suggest <domain> [--dry-run]
```

Compute AI Visibility Score (0–100), Gap-Tabelle, and competitor-content-gap
recommendations. `suggest` scrapes brand + competitor homepages (respects
robots.txt) and asks the LLM to identify content gaps with prompt-injection
defense wrapping.

### 5. Generate artifacts

```
cd web
npx tsx lib/aeo/cli.ts artifacts <domain>
```

Writes to `output/<domain>/aeo/artifacts/`:
- `llms.txt` — ready to upload to the domain root
- `robots-patch.diff` — diff to apply to existing robots.txt
- `robots-proposed.txt` — full proposed robots.txt
- `schema.jsonld` — Organization + Person + Article JSON-LD snippets
- `eeat-recommendations.md` — prioritized E-E-A-T recommendations

### 6. Site-side audit (delegated)

For deeper site-side AEO factors (citability, server-side rendering, AI
crawler accessibility), delegate to the `seo-geo` subagent in parallel. The
`seo-geo` output complements `seo-aeo` but is not strictly required for the
client report.

### 7. Render client report

```
cd web
npx tsx lib/aeo/cli.ts report <domain> --lang de
```

Renders both:
- `output/<domain>/aeo/report.html` — self-contained, can be emailed
- `output/<domain>/aeo/report.pdf` — Playwright-rendered, branded with logo + accent color

Use `--no-pdf` to skip PDF rendering (e.g. if Chromium not available).
Use `--lang en` for English output.

### 8. Compose (all-in-one)

Once prompts are saved and a run is done, you can compose steps 5–7:

```
cd web
npx tsx lib/aeo/cli.ts audit <domain> --lang de [--dry-run]
```

## Output Summary to the User

After completing the flow, summarize:

```
✅ AEO-Bericht fertig für <brand>
   Score: <N>/100 (<rating>)
   Gap zum stärksten Wettbewerber: <X> Punkte
   Calls: <N>, Kosten: $<X.XX>

📂 Ergebnisse:
   Bericht (PDF):  output/<domain>/aeo/report.pdf
   Bericht (HTML): output/<domain>/aeo/report.html
   Artefakte:      output/<domain>/aeo/artifacts/

📋 Top 3 Maßnahmen:
   1. <title>
   2. <title>
   3. <title>
```

## Cost Guard

The runner enforces `--max-spend` (default 20 USD). Typical real-world cost:

| Provider Mix | Prompts × Samples | Estimate |
|---|---|---|
| openai + anthropic (cheap models) | 10 × 3 | $1–2 |
| openai + anthropic + gemini | 10 × 3 | $3–5 |
| 4 providers + competitor suggest + scoring | 15 × 3 | $5–10 |

## Important Defaults

- Language: `de` (Deutsch) — the user's primary market is DACH
- Dry-run: prefer for first invocation on new domains to validate flow
- Samples: 3 (provides citation rate stability without 2×–3× cost)
- Logo/accent: leave default if user doesn't provide

## Delegations

| Task | Delegate to |
|---|---|
| Site-side AEO audit (citability, SSR check) | `seo-geo` subagent |
| Schema detail review | `seo-schema` subagent |
| Technical SEO check on the domain | `seo-technical` subagent |

## References

See `references/prompt-templates.md` for industry-specific prompt seed examples
and `references/interpretation-guide.md` for reading the AI Visibility Score.
