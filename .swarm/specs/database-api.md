# Task: Database & API Routes

## Objective
Set up PostgreSQL via Docker Compose, define the database schema with Drizzle ORM, and create all CRUD API routes for projects and audits. This provides the data layer that the dashboard pages and audit engine interact with.

## Scope

### Create These Files
- `web/docker-compose.yml` — PostgreSQL 16 container with volume persistence
- `web/drizzle.config.ts` — Drizzle Kit configuration pointing to schema file and PostgreSQL connection
- `web/lib/db/schema.ts` — Drizzle ORM schema: projects, audits, audit_categories, audit_issues tables
- `web/lib/db/index.ts` — Database connection singleton using `postgres` driver + drizzle wrapper
- `web/lib/db/seed.ts` — Seed script that creates a sample project with a completed audit (watchmen.io data)
- `web/app/api/projects/route.ts` — GET (list all projects), POST (create new project)
- `web/app/api/projects/[id]/route.ts` — GET (single project with audits), PUT (update), DELETE
- `web/app/api/audits/route.ts` — GET (list audits, filterable by projectId), POST (create new audit)
- `web/app/api/audits/[id]/route.ts` — GET (single audit with categories and issues), PUT (update status/results), DELETE
- `web/app/api/audits/[id]/stream/route.ts` — GET (SSE endpoint for streaming audit progress)
- `web/.env.example` — DATABASE_URL=postgresql://postgres:postgres@localhost:5432/claude_seo

### Read for Patterns (do not modify)
- `web/types/index.ts` — `Project`, `Audit`, `AuditCategory`, `AuditIssue`, `CategoryType` type definitions
- `output/watchmen.io/FULL-AUDIT-REPORT.md` — Example audit report structure for seed data
- `output/watchmen.io/ACTION-PLAN.md` — Example action plan structure for seed data

### Off-Limits (never touch)
- All files outside `web/lib/db/`, `web/app/api/`, `web/docker-compose.yml`, `web/drizzle.config.ts`
- All existing claude-seo files
- `web/package.json` (Worker 1 owns — needed packages: drizzle-orm, postgres, drizzle-kit as devDep)

## Context

### Database Schema Design

```sql
-- projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- audits
CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, running, completed, failed
  overall_score INTEGER,            -- 0-100
  business_type VARCHAR(100),
  pages_crawled INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  full_report_md TEXT,              -- raw markdown of FULL-AUDIT-REPORT.md
  action_plan_md TEXT,              -- raw markdown of ACTION-PLAN.md
  error_message TEXT,               -- if status=failed
  created_at TIMESTAMP DEFAULT NOW()
);

-- audit_categories
CREATE TABLE audit_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL,    -- matches CategoryType
  score INTEGER NOT NULL,           -- 0-100
  weight INTEGER NOT NULL,          -- percentage (e.g., 25)
  weighted_score REAL NOT NULL,     -- score * weight / 100
  findings_json JSONB               -- detailed findings per category
);

-- audit_issues
CREATE TABLE audit_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL,
  severity VARCHAR(10) NOT NULL,    -- critical, high, medium, low
  title VARCHAR(500) NOT NULL,
  description TEXT,
  impact TEXT,
  recommendation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);
```

### Drizzle ORM Schema Pattern
```typescript
import { pgTable, uuid, varchar, integer, real, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  url: varchar('url', { length: 2048 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ... similar for audits, auditCategories, auditIssues
// Use drizzle relations to define foreign keys
```

### API Route Patterns
All routes follow Next.js App Router convention:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/projects
export async function GET() {
  const allProjects = await db.select().from(projects).orderBy(projects.createdAt);
  return NextResponse.json(allProjects);
}

// POST /api/projects
export async function POST(request: NextRequest) {
  const body = await request.json();
  const [project] = await db.insert(projects).values({
    name: body.name,
    url: body.url,
  }).returning();
  return NextResponse.json(project, { status: 201 });
}
```

### SSE Streaming Endpoint Pattern
The `/api/audits/[id]/stream` endpoint uses Server-Sent Events to stream audit progress:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Poll audit status from DB every 2 seconds
      // Send events: { type: 'progress', message: '...', percentage: 30 }
      // Send event: { type: 'complete', auditId: '...' } when done
      // Close stream
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Seed Data
Use the watchmen.io audit from `output/watchmen.io/` as seed data:
- Project: name="watchmen.io", url="https://watchmen.io"
- Audit: overall_score=34, business_type="Cybersecurity Consulting", pages_crawled=4, status="completed"
- Categories: technical=52, content=35, on_page=35, schema=0, performance=50, images=35, ai_readiness=15
- Issues: Extract top 10 issues from the audit report with correct severity levels

### API Response Shapes

**GET /api/projects** — returns `Project[]` with computed fields:
```json
[{
  "id": "uuid",
  "name": "watchmen.io",
  "url": "https://watchmen.io",
  "createdAt": "2026-03-02T...",
  "updatedAt": "2026-03-02T...",
  "lastAuditScore": 34,
  "lastAuditDate": "2026-03-02T...",
  "auditCount": 1
}]
```
The `lastAuditScore`, `lastAuditDate`, and `auditCount` are computed via JOIN/subquery.

**GET /api/audits/[id]** — returns audit with categories and issues:
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "status": "completed",
  "overallScore": 34,
  "businessType": "Cybersecurity Consulting",
  "pagesCrawled": 4,
  "categories": [...],
  "issues": [...],
  "fullReportMd": "# Full SEO Audit...",
  "actionPlanMd": "# SEO Action Plan..."
}
```

## Acceptance Criteria
- [ ] `docker compose up -d` starts PostgreSQL container on port 5432
- [ ] `npx drizzle-kit push` creates all 4 tables in the database
- [ ] `npx tsx web/lib/db/seed.ts` populates database with watchmen.io sample data
- [ ] `GET /api/projects` returns list of projects with computed lastAuditScore, lastAuditDate, auditCount
- [ ] `POST /api/projects` creates a new project and returns it with 201 status
- [ ] `GET /api/projects/[id]` returns single project with its audits array
- [ ] `DELETE /api/projects/[id]` cascades deletes to audits, categories, and issues
- [ ] `GET /api/audits?projectId=xxx` returns filtered audits
- [ ] `POST /api/audits` creates a new audit with status 'pending'
- [ ] `GET /api/audits/[id]` returns audit with categories and issues arrays
- [ ] `PUT /api/audits/[id]` can update status, score, report markdown, etc.
- [ ] `GET /api/audits/[id]/stream` returns SSE stream (Content-Type: text/event-stream)
- [ ] All API routes return proper error responses (400 for bad input, 404 for not found, 500 for server errors)
- [ ] Database connection is a singleton (not created per request)
- [ ] No TypeScript errors

## Technical Guidance
- Use `postgres` package (not `pg`) as the Drizzle driver — it's lighter and has better TypeScript support
- The `drizzle.config.ts` should use `type: 'postgresql'` and read `DATABASE_URL` from env
- For computed fields in project list (lastAuditScore, etc.), use a Drizzle subquery or raw SQL via `db.execute(sql\`...\`)`
- The SSE stream endpoint should poll the audit record every 2 seconds and detect status changes. When status is 'completed' or 'failed', send final event and close.
- For the seed script, read the actual markdown files from `../output/watchmen.io/FULL-AUDIT-REPORT.md` and `../output/watchmen.io/ACTION-PLAN.md` using `fs.readFileSync`
- Add `"db:push": "drizzle-kit push"`, `"db:seed": "tsx lib/db/seed.ts"`, `"db:studio": "drizzle-kit studio"` to package.json scripts section (note: Worker 1 owns package.json, so document this in a MERGE-NOTES.md)

## Dependencies
- **Requires output from**: `scaffold-foundation` — needs package.json with drizzle-orm, postgres, types
- **Provides to**: `dashboard-pages` (reads from API), `audit-engine` (writes audit results to API)

## Completion Signal
When **all acceptance criteria are met**, output:
`<promise>DATABASE_API_COMPLETE</promise>`

If blocked and unable to continue, write details to `BLOCKERS.md` then output:
`<promise>DATABASE_API_BLOCKED</promise>`
