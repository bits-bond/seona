<!-- Updated: 2026-03-06 -->

![SEONA](screenshots/cover-image.jpeg)

# SEONA

AI-powered SEO audit platform. Combines Claude Code skills for deep analysis with a Next.js dashboard for visualizing results.

![SEO Command Demo](screenshots/seo-command-demo.gif)

[![Claude Code Skill](https://img.shields.io/badge/Claude%20Code-Skill-blue)](https://claude.ai/claude-code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## What's Included

- **CLI Skills** — 13 SEO analysis commands for Claude Code (`/seo audit`, `/seo schema`, etc.)
- **Web Dashboard** — Next.js 15 + HeroUI app with charts, reports, and project management
- **Background Audits** — Trigger audits from the dashboard; Claude Code runs in the background on your machine

## Quick Start

### 1. Install CLI Skills

```bash
curl -fsSL https://raw.githubusercontent.com/DDX1/seona/main/install.sh | bash
```

Windows:

```powershell
irm https://raw.githubusercontent.com/DDX1/seona/main/install.ps1 | iex
```

Or install manually:

```bash
git clone https://github.com/DDX1/seona.git
cd seona
./install.sh
```

### 2. Use from Claude Code

```bash
claude

# Full site audit
/seo audit https://example.com

# Single page analysis
/seo page https://example.com/about

# Schema markup
/seo schema https://example.com
```

### 3. Web Dashboard (Optional)

Requires: Node.js 18+, Docker

```bash
cd web

# Start PostgreSQL
docker compose up -d

# Install dependencies
npm install

# Configure env (defaults work with Docker)
cp .env.example .env

# Push database schema
npm run db:push

# Seed sample data (optional)
npm run db:seed

# Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create a project, add a URL, and run an audit from the browser.

### Demo

[Watch the full demo on YouTube](https://www.youtube.com/watch?v=COMnNlUakQk)

**`/seo audit` — full site audit with parallel subagents:**

![SEO Audit Demo](screenshots/seo-audit-demo.gif)

## CLI Commands

| Command                       | Description                                                        |
| ----------------------------- | ------------------------------------------------------------------ |
| `/seo audit <url>`            | Full website audit with parallel subagent delegation               |
| `/seo page <url>`             | Deep single-page analysis                                          |
| `/seo sitemap <url>`          | Analyze existing XML sitemap                                       |
| `/seo sitemap generate`       | Generate new sitemap with industry templates                       |
| `/seo schema <url>`           | Detect, validate, and generate Schema.org markup                   |
| `/seo images <url>`           | Image optimization analysis                                        |
| `/seo technical <url>`        | Technical SEO audit (8 categories)                                 |
| `/seo content <url>`          | E-E-A-T and content quality analysis                               |
| `/seo geo <url>`              | AI Overviews / Generative Engine Optimization                      |
| `/seo plan <type>`            | Strategic SEO planning (saas, local, ecommerce, publisher, agency) |
| `/seo programmatic <url>`     | Programmatic SEO analysis and planning                             |
| `/seo competitor-pages <url>` | Competitor comparison page generation                              |
| `/seo hreflang <url>`         | Hreflang/i18n SEO audit and generation                             |

## Scoring

| Category | Weight |
|----------|--------|
| Technical SEO | 25% |
| Content Quality | 25% |
| On-Page SEO | 20% |
| Schema / Structured Data | 10% |
| Performance (CWV) | 10% |
| Images | 5% |
| AI Search Readiness | 5% |

## Features

### Core Web Vitals

- **LCP** (Largest Contentful Paint): Target < 2.5s
- **INP** (Interaction to Next Paint): Target < 200ms
- **CLS** (Cumulative Layout Shift): Target < 0.1

### E-E-A-T Analysis

- **Experience**: First-hand knowledge signals
- **Expertise**: Author credentials and depth
- **Authoritativeness**: Industry recognition
- **Trustworthiness**: Contact info, security, transparency

### Schema Markup

- Detection: JSON-LD (preferred), Microdata, RDFa
- Validation against Google's supported types
- Generation with templates
- Deprecation awareness (HowTo, FAQ restrictions, SpecialAnnouncement)

### AI Search Optimization (GEO)

- Google AI Overviews
- ChatGPT web search
- Perplexity
- Other AI-powered search

### Web Dashboard

- Project management with multiple URLs
- Real-time audit progress via SSE
- Category score radar charts
- Prioritized issue lists with severity levels
- Full markdown report viewer with copy-to-clipboard
- Responsive design (desktop + mobile)

## Tech Stack

### CLI Skills
- Python 3.8+
- Claude Code CLI
- 6 parallel subagents for full audits

### Web Dashboard
- Next.js 15 (App Router)
- HeroUI v3 + Tailwind CSS v4
- Recharts for data visualization
- PostgreSQL 16 (via Docker)
- Drizzle ORM
- SWR for data fetching

## Architecture

```
seo/                    # Main skill files
skills/seo-*/           # 12 sub-skills
agents/seo-*.md         # 6 subagents
scripts/                # Shared Python scripts
web/                    # Next.js dashboard
  app/                  # App Router pages + API routes
  components/           # UI components (dashboard, ui)
  lib/                  # DB schema, audit engine, utils
```

## Requirements

| Component | Requirement |
|-----------|-------------|
| CLI Skills | Python 3.8+, Claude Code CLI |
| Web Dashboard | Node.js 18+, Docker |
| Optional | Playwright (for screenshots) |

## Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/DDX1/seona/main/uninstall.sh | bash
```

## Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Commands Reference](docs/COMMANDS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [MCP Integration](docs/MCP-INTEGRATION.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please read the guidelines in `docs/` before submitting PRs.

---

Built for Claude Code by [@DDX1](https://github.com/DDX1)
