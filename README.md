![SEONA](screenshots/cover-image.jpeg)

# SEONA — AI-Powered SEO Audit Platform

SEONA is a comprehensive SEO analysis toolkit that combines 17 specialized AI-driven audit modules with a real-time web dashboard. Run deep site audits, detect schema issues, analyze content quality, and track SEO health — all from your terminal or browser.

![SEO Command Demo](screenshots/seo-command-demo.gif)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [CLI Commands](#cli-commands)
- [Web Dashboard](#web-dashboard)
- [Scoring Methodology](#scoring-methodology)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Uninstall](#uninstall)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Features

**Site Auditing** — Full-site crawl with parallel subagent delegation across 7 scoring categories. Supports up to 500 pages per audit.

**Single-Page Deep Analysis** — On-page elements, meta tags, schema, images, content quality, and performance for any URL.

**Core Web Vitals** — LCP (< 2.5s), INP (< 200ms), CLS (< 0.1) measurement and recommendations.

**E-E-A-T Analysis** — Experience, Expertise, Authoritativeness, and Trustworthiness scoring per Google's quality guidelines.

**Schema Markup** — Detection (JSON-LD, Microdata, RDFa), validation against Google's supported types, and generation with templates. Includes deprecation awareness for HowTo, FAQ, and SpecialAnnouncement.

**AI Search Optimization (GEO)** — Optimize for Google AI Overviews, ChatGPT web search, Perplexity, and other AI-powered search engines.

**Technical SEO** — Crawlability, indexability, security headers, URL structure, mobile optimization, JavaScript rendering, and structured data validation.

**Content Quality** — Readability scoring, thin content detection, keyword analysis, and AI citation readiness assessment.

**International SEO** — Hreflang audit, validation, and generation for multi-language/multi-region sites.

**Programmatic SEO** — Template analysis, URL pattern optimization, internal linking automation, and index bloat prevention for pages generated at scale.

**Web Dashboard** — Real-time audit progress via SSE, radar charts, prioritized issue lists with severity levels, markdown report viewer, and PDF export.

---

## Quick Start

### Option 1: Install CLI Skills

```bash
curl -fsSL https://raw.githubusercontent.com/DDX1/seona/main/install.sh | bash
```

Windows:

```powershell
irm https://raw.githubusercontent.com/DDX1/seona/main/install.ps1 | iex
```

Or clone and install manually:

```bash
git clone https://github.com/DDX1/seona.git
cd seona
./install.sh
```

### Option 2: Run a Quick Audit

```bash
# Full site audit
/seo audit https://example.com

# Single page analysis
/seo page https://example.com/about

# Schema markup detection
/seo schema https://example.com
```

### Option 3: Launch the Web Dashboard

Requires Node.js 18+ and Docker.

```bash
cd web

# Start PostgreSQL
docker compose up -d

# Install dependencies & configure
npm install
cp .env.example .env

# Initialize the database
npm run db:push

# Seed sample data (optional)
npm run db:seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create a project, add a URL, and launch an audit from the browser.

---

## CLI Commands

| Command | Description |
|---|---|
| `/seo audit <url>` | Full website audit with parallel subagent delegation |
| `/seo page <url>` | Deep single-page SEO analysis |
| `/seo technical <url>` | Technical SEO audit (8 categories) |
| `/seo content <url>` | E-E-A-T and content quality analysis |
| `/seo schema <url>` | Detect, validate, and generate Schema.org markup |
| `/seo sitemap <url>` | Analyze existing XML sitemap |
| `/seo sitemap generate` | Generate new sitemap with industry templates |
| `/seo images <url>` | Image optimization analysis |
| `/seo geo <url>` | AI Overviews / Generative Engine Optimization |
| `/seo hreflang <url>` | Hreflang and international SEO audit |
| `/seo plan <type>` | Strategic SEO planning (saas, local, ecommerce, publisher, agency) |
| `/seo programmatic <url>` | Programmatic SEO analysis for pages at scale |
| `/seo competitor-pages <url>` | Competitor comparison page generation |
| `/seo keywords <url>` | Keyword research and opportunity analysis |
| `/seo backlinks <url>` | Backlink profile analysis |
| `/seo competitor <url>` | Competitor SEO benchmarking |
| `/seo gsc` | Google Search Console integration and insights |

---

## Web Dashboard

The dashboard provides a visual interface for managing projects and running audits.

- **Project Management** — Organize multiple sites with separate URL tracking
- **Real-Time Progress** — Server-Sent Events stream audit progress live
- **Score Visualization** — Radar charts for category scores, trend tracking
- **Issue Prioritization** — Critical, high, medium, and low severity groupings
- **Full Reports** — Markdown viewer with copy-to-clipboard and PDF export
- **Responsive Design** — Optimized for desktop and mobile

---

## Scoring Methodology

Each audit produces an overall SEO Health Score (0–100) calculated from seven weighted categories:

| Category | Weight |
|---|---|
| Technical SEO | 25% |
| Content Quality | 25% |
| On-Page SEO | 20% |
| Schema / Structured Data | 10% |
| Performance (Core Web Vitals) | 10% |
| Images | 5% |
| AI Search Readiness | 5% |

---

## Architecture

```
seona/
├── skills/               # 17 specialized SEO analysis modules
│   ├── seo-audit/        # Full-site audit orchestrator
│   ├── seo-page/         # Single-page deep analysis
│   ├── seo-technical/    # Technical SEO checks
│   ├── seo-content/      # Content quality & E-E-A-T
│   ├── seo-schema/       # Schema.org markup
│   ├── seo-sitemap/      # XML sitemap analysis
│   ├── seo-images/       # Image optimization
│   ├── seo-geo/          # AI search optimization
│   ├── seo-hreflang/     # International SEO
│   ├── seo-plan/         # Strategic planning
│   ├── seo-programmatic/ # Programmatic SEO
│   ├── seo-keywords/     # Keyword research
│   ├── seo-backlinks/    # Backlink analysis
│   ├── seo-competitor/   # Competitor benchmarking
│   └── ...
├── agents/               # 12 parallel subagents for audit delegation
├── web/                  # Next.js dashboard application
│   ├── app/              # App Router pages & API routes
│   ├── components/       # UI components
│   ├── lib/              # Database schema, audit engine, PDF generation
│   └── types/            # TypeScript type definitions
└── scripts/              # Utility scripts
```

---

## Requirements

| Component | Prerequisite |
|---|---|
| CLI Skills | Python 3.8+ |
| Web Dashboard | Node.js 18+, Docker |
| PDF Export | Included (server-side rendering) |
| Screenshots | Playwright (optional) |

### Tech Stack

**Dashboard:** Next.js 15 (App Router) · React 19 · HeroUI v3 · Tailwind CSS v4 · Recharts · PostgreSQL 16 · Drizzle ORM · SWR

---

## Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/DDX1/seona/main/uninstall.sh | bash
```

---

## Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Commands Reference](docs/COMMANDS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [MCP Integration](docs/MCP-INTEGRATION.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

---

## Demo

[Watch the full demo on YouTube](https://www.youtube.com/watch?v=COMnNlUakQk)

**Full site audit with parallel subagents:**

![SEO Audit Demo](screenshots/seo-audit-demo.gif)

---

## Contributing

Contributions are welcome. Please review the guidelines in `docs/` before submitting a pull request.

## License

MIT License — see [LICENSE](LICENSE) for details.
