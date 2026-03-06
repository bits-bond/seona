# Installation Guide

## Prerequisites

- **Python 3.8+** with pip
- **Git** for cloning the repository
- **Claude Code CLI** installed and configured

Optional:
- **Playwright** for screenshot capabilities

## Quick Install

### Unix/macOS/Linux

```bash
curl -fsSL https://raw.githubusercontent.com/DDX1/seona/main/install.sh | bash
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/DDX1/seona/main/install.ps1 | iex
```

## Manual Installation

1. **Clone the repository**

```bash
git clone https://github.com/DDX1/seona.git
cd seona
```

2. **Run the installer**

```bash
./install.sh
```

3. **Install Python dependencies** (if not done automatically)

The installer creates a venv at `~/.claude/skills/seo/.venv/`. If that fails, install manually:

```bash
# Option A: Use the venv
~/.claude/skills/seo/.venv/bin/pip install -r ~/.claude/skills/seo/requirements.txt

# Option B: User-level install
pip install --user -r ~/.claude/skills/seo/requirements.txt
```

4. **Install Playwright browsers** (optional, for visual analysis)

```bash
pip install playwright
playwright install chromium
```

Playwright is optional — without it, visual analysis uses WebFetch as a fallback.

## Installation Paths

The installer copies files to:

| Component | Path |
|-----------|------|
| Main skill | `~/.claude/skills/seo/` |
| Sub-skills | `~/.claude/skills/seo-*/` |
| Subagents | `~/.claude/agents/seo-*.md` |

## Verify Installation

1. Start Claude Code:

```bash
claude
```

2. Check that the skill is loaded:

```
/seo
```

You should see a help message or prompt for a URL.

## Web Dashboard (Optional)

SEONA includes a full web dashboard for visualizing audit results with charts and reports.

### Requirements

- **Node.js 18+** and **npm**
- **Docker** (for PostgreSQL database)

### Setup

1. **Start the database**

```bash
cd web
docker compose up -d
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

```bash
cp .env.example .env
```

The defaults work out of the box with the Docker container.

4. **Push the database schema**

```bash
npm run db:push
```

5. **Seed sample data** (optional)

```bash
npm run db:seed
```

6. **Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### How It Works

The dashboard spawns Claude Code in the background when you trigger an audit from the UI. The CLI runs the `/seo audit` skill, then the results are parsed and stored in PostgreSQL. You can view scores, category breakdowns, issues, and full markdown reports — all from the browser.

### Dashboard Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema changes to the database |
| `npm run db:seed` | Seed sample audit data |
| `npm run db:studio` | Open Drizzle Studio (database browser) |

## Uninstallation

```bash
curl -fsSL https://raw.githubusercontent.com/DDX1/seona/main/uninstall.sh | bash
```

Or manually:

```bash
rm -rf ~/.claude/skills/seo
rm -rf ~/.claude/skills/seo-audit
rm -rf ~/.claude/skills/seo-competitor-pages
rm -rf ~/.claude/skills/seo-content
rm -rf ~/.claude/skills/seo-geo
rm -rf ~/.claude/skills/seo-hreflang
rm -rf ~/.claude/skills/seo-images
rm -rf ~/.claude/skills/seo-page
rm -rf ~/.claude/skills/seo-plan
rm -rf ~/.claude/skills/seo-programmatic
rm -rf ~/.claude/skills/seo-schema
rm -rf ~/.claude/skills/seo-sitemap
rm -rf ~/.claude/skills/seo-technical
rm -f ~/.claude/agents/seo-*.md
```

## Upgrading

To upgrade to the latest version:

```bash
# Uninstall current version
curl -fsSL https://raw.githubusercontent.com/DDX1/seona/main/uninstall.sh | bash

# Install new version
curl -fsSL https://raw.githubusercontent.com/DDX1/seona/main/install.sh | bash
```

## Troubleshooting

### "Skill not found" error

Ensure the skill is installed in the correct location:

```bash
ls ~/.claude/skills/seo/SKILL.md
```

If the file doesn't exist, re-run the installer.

### Python dependency errors

Install dependencies manually:

```bash
pip install beautifulsoup4 requests lxml playwright Pillow urllib3 validators
```

### Playwright screenshot errors

Install Chromium browser:

```bash
playwright install chromium
```

### Permission errors on Unix

Make sure scripts are executable:

```bash
chmod +x ~/.claude/skills/seo/scripts/*.py
chmod +x ~/.claude/skills/seo/hooks/*.py
chmod +x ~/.claude/skills/seo/hooks/*.sh
```
