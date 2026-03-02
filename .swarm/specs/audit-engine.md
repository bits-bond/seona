# Task: Audit Engine (Claude Code CLI Integration)

## Objective
Build the audit execution engine that spawns Claude Code CLI processes to run SEO audits, streams progress to the frontend via SSE, parses the resulting markdown reports, and stores structured results in the database via API routes. Also create the audit form and progress UI components.

## Scope

### Create These Files

#### Engine Library
- `web/lib/audit-engine/runner.ts` — Main audit runner: spawns `claude` CLI, monitors output, updates DB via API
- `web/lib/audit-engine/parser.ts` — Parses FULL-AUDIT-REPORT.md and ACTION-PLAN.md into structured data (scores, categories, issues)
- `web/lib/audit-engine/types.ts` — Engine-specific types: AuditProgress, ParsedReport, ParsedActionPlan
- `web/lib/audit-engine/stream.ts` — SSE client helper for frontend to connect to audit progress stream
- `web/lib/audit-engine/index.ts` — Barrel export

#### API Route for Triggering Audit
- `web/app/api/audits/[id]/run/route.ts` — POST endpoint that triggers the audit runner for a given audit ID

#### UI Components
- `web/components/audit/audit-form.tsx` — Form component for starting a new audit (URL input, project selector)
- `web/components/audit/audit-progress.tsx` — Real-time progress display during audit execution
- `web/components/audit/index.ts` — Barrel export

### Read for Patterns (do not modify)
- `web/types/index.ts` — `Audit`, `AuditCategory`, `AuditIssue`, `CategoryType` types
- `web/lib/utils.ts` — Utility functions
- `output/watchmen.io/FULL-AUDIT-REPORT.md` — Example of what the CLI produces (parse this format)
- `output/watchmen.io/ACTION-PLAN.md` — Example action plan output (parse this format)
- `seo/SKILL.md` — How the SEO audit orchestration works (understand the scoring methodology)
- `skills/seo-audit/SKILL.md` — The audit skill definition that gets invoked

### Off-Limits (never touch)
- All files outside `web/lib/audit-engine/`, `web/components/audit/`, `web/app/api/audits/[id]/run/`
- `web/app/api/audits/route.ts`, `web/app/api/audits/[id]/route.ts` (Worker 4)
- All existing claude-seo files (skills, agents, scripts)

## Context

### How Claude Code CLI Works
The `claude` CLI is invoked from the terminal. To run an audit programmatically:

```bash
# Basic invocation (prints to stdout, no interactive mode)
claude --print --dangerously-skip-permissions "Run /seo-audit https://example.com. Save all output files to /path/to/output/"
```

Key flags:
- `--print` or `-p`: Non-interactive mode, prints output to stdout
- `--dangerously-skip-permissions`: Auto-approve all tool uses (needed for unattended execution)
- `--output-dir`: Not a real flag — instead, include the output path in the prompt
- The CLI will create files in the `output/<domain>/` directory relative to the project root

### Audit Runner Architecture

```
POST /api/audits/[id]/run
  │
  ▼
runner.ts: startAudit(auditId)
  │
  ├── 1. Fetch audit record from DB (GET /api/audits/[id])
  ├── 2. Update status to 'running' (PUT /api/audits/[id])
  ├── 3. Spawn claude CLI process:
  │      child_process.spawn('claude', [
  │        '--print',
  │        '--dangerously-skip-permissions',
  │        '-p', `Run /seo-audit ${url}. Save output to output/${domain}/`
  │      ], { cwd: projectRoot })
  │
  ├── 4. Stream stdout/stderr, detect progress markers:
  │      - "Fetching homepage..." → 10%
  │      - "Detecting business type..." → 15%
  │      - "Launching subagents..." → 20%
  │      - "Technical SEO audit..." → 30-40%
  │      - "Content quality audit..." → 40-50%
  │      - "Schema audit..." → 50-60%
  │      - "Performance audit..." → 60-70%
  │      - "Generating report..." → 80%
  │      - "Writing ACTION-PLAN.md..." → 90%
  │      - Process exit → 100%
  │
  ├── 5. On completion:
  │      - Read output files (FULL-AUDIT-REPORT.md, ACTION-PLAN.md)
  │      - Parse into structured data (parser.ts)
  │      - Store in database (PUT /api/audits/[id] with results)
  │      - Update status to 'completed'
  │
  └── 6. On error:
         - Update status to 'failed'
         - Store error message
```

### Report Parser (parser.ts)

The parser extracts structured data from the markdown reports. Key extraction patterns:

**From FULL-AUDIT-REPORT.md:**
```markdown
## SEO Health Score: 34/100

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 25% | 52/100 | 13.0 |
| Content Quality | 25% | 35/100 | 8.8 |
...
```

Parse with regex:
- Overall score: `/## SEO Health Score:\s*(\d+)\/100/`
- Category scores: `/\|\s*(.+?)\s*\|\s*(\d+)%\s*\|\s*(\d+)\/100\s*\|\s*([\d.]+)\s*\|/g`
- Business type: `/\*\*Business Type:\*\*\s*(.+)/`
- Pages crawled: `/\*\*Pages Crawled:\*\*\s*(\d+)/`

**From ACTION-PLAN.md:**
Issues are grouped by severity headers:
```markdown
## CRITICAL -- Fix Immediately (Week 1)
### 1. Create robots.txt
...
**Impact:** Crawlability +30 points

## HIGH -- Fix Within 2 Weeks
### 9. Add Organization JSON-LD schema
...
```

Parse each `###` heading as an issue:
- Map `## CRITICAL` → severity 'critical'
- Map `## HIGH` → severity 'high'
- Map `## MEDIUM` → severity 'medium'
- Map `## LOW` → severity 'low'
- Extract title from `### N. Title`
- Extract description from body text
- Extract impact from `**Impact:**` lines

### Category Name Mapping
Map parsed category names to CategoryType enum:
```typescript
const CATEGORY_MAP: Record<string, CategoryType> = {
  'Technical SEO': 'technical',
  'Content Quality': 'content',
  'On-Page SEO': 'on_page',
  'Schema / Structured Data': 'schema',
  'Performance (CWV)': 'performance',
  'Images': 'images',
  'AI Search Readiness': 'ai_readiness',
};
```

### SSE Client Helper (stream.ts)
```typescript
export function connectAuditStream(
  auditId: string,
  onProgress: (data: AuditProgress) => void,
  onComplete: (data: { auditId: string }) => void,
  onError: (error: string) => void,
): () => void {
  const eventSource = new EventSource(`/api/audits/${auditId}/stream`);

  eventSource.addEventListener('progress', (e) => {
    onProgress(JSON.parse(e.data));
  });

  eventSource.addEventListener('complete', (e) => {
    onComplete(JSON.parse(e.data));
    eventSource.close();
  });

  eventSource.addEventListener('error', (e) => {
    onError('Connection lost');
    eventSource.close();
  });

  // Return cleanup function
  return () => eventSource.close();
}
```

### Audit Progress Types
```typescript
export interface AuditProgress {
  percentage: number;    // 0-100
  stage: string;         // "Fetching homepage", "Running technical audit", etc.
  message: string;       // Current output line from CLI
  timestamp: Date;
}

export interface ParsedReport {
  overallScore: number;
  businessType: string | null;
  pagesCrawled: number | null;
  categories: {
    category: CategoryType;
    score: number;
    weight: number;
    weightedScore: number;
  }[];
  fullReportMd: string;
}

export interface ParsedActionPlan {
  issues: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string | null;
    orderIndex: number;
    category: CategoryType | null;  // best-guess mapping
  }[];
  actionPlanMd: string;
}
```

### Audit Form Component
```tsx
interface AuditFormProps {
  projectId?: string;    // pre-selected project (from URL params)
  projects: Project[];   // available projects for dropdown
  onSubmit: (data: { projectId: string; url: string }) => void;
  isSubmitting: boolean;
}
```
- Dropdown to select existing project OR toggle to create new
- URL input (auto-fills from selected project, editable for new)
- Project name input (only when creating new)
- Submit button: "Start Audit"

### Audit Progress Component
```tsx
interface AuditProgressProps {
  auditId: string;
  onComplete: () => void;
}
```
- Connects to SSE stream via `connectAuditStream()`
- Shows: progress bar (percentage), current stage name, scrolling log of messages
- HeroUI Progress component for the bar
- Auto-scrolling log area with monospace font
- On complete: shows success message and "View Results" button

## Acceptance Criteria
- [ ] `POST /api/audits/[id]/run` spawns a claude CLI process and returns 202 Accepted
- [ ] Runner detects progress stages from CLI stdout and updates SSE stream
- [ ] Runner reads output files on completion and parses them with parser.ts
- [ ] Parser correctly extracts overall score from FULL-AUDIT-REPORT.md
- [ ] Parser correctly extracts all 7 category scores with weights
- [ ] Parser correctly extracts business type and pages crawled
- [ ] Parser correctly extracts issues from ACTION-PLAN.md with severity mapping
- [ ] Parsed results are stored in database via API (categories in audit_categories, issues in audit_issues)
- [ ] On audit failure (process exit code !== 0), status is set to 'failed' with error message
- [ ] SSE stream client helper connects, receives progress events, handles completion and errors
- [ ] Audit form validates URL format before submission
- [ ] Audit progress component shows real-time progress bar and log
- [ ] Audit progress component navigates to audit detail on completion
- [ ] No TypeScript errors
- [ ] Handles case where `claude` CLI is not installed (shows helpful error message)

## Technical Guidance
- Use `child_process.spawn` (not `exec`) for streaming stdout. Import from `node:child_process`.
- The `claude` CLI process should run with `cwd` set to the claude-seo project root (one level up from `web/`): `path.resolve(process.cwd(), '..')`
- For progress detection, scan each stdout line for keywords and estimate percentage
- The output directory will be at `../output/<domain>/` relative to the web app
- Read output files using `fs.readFileSync` after the process completes
- For the parser, use simple regex — don't over-engineer it. The markdown format is consistent.
- The audit run endpoint should be async — spawn the process and return immediately. Progress is tracked via SSE.
- Store the process reference in a Map keyed by auditId for potential cancellation
- Use `"use client"` on form and progress components

## Dependencies
- **Requires output from**: `scaffold-foundation` (types, utils), `database-api` (API routes, DB schema)
- **Provides to**: `dashboard-pages` — AuditForm and AuditProgress used in new audit page

## Completion Signal
When **all acceptance criteria are met**, output:
`<promise>AUDIT_ENGINE_COMPLETE</promise>`

If blocked and unable to continue, write details to `BLOCKERS.md` then output:
`<promise>AUDIT_ENGINE_BLOCKED</promise>`
