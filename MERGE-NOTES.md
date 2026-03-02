# Merge Notes: Database & API Worker

## Package.json Scripts (Worker 1 owns package.json)

The following scripts need to be added to `web/package.json`:

```json
{
  "scripts": {
    "db:push": "drizzle-kit push",
    "db:seed": "tsx lib/db/seed.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

## Required Dependencies

Ensure these are in `web/package.json` (Worker 1 should already have them):

- `drizzle-orm` — ORM for database queries
- `postgres` — PostgreSQL driver (not `pg`)
- `drizzle-kit` (devDependency) — Migration/push tooling
- `tsx` (devDependency) — For running seed script

## Setup Instructions

1. Start PostgreSQL: `cd web && docker compose up -d`
2. Push schema: `cd web && npx drizzle-kit push`
3. Seed data: `cd web && npx tsx lib/db/seed.ts`

## Files Created

- `web/docker-compose.yml` — PostgreSQL 16 container
- `web/drizzle.config.ts` — Drizzle Kit configuration
- `web/.env.example` — Environment variables template
- `web/lib/db/schema.ts` — Database schema (projects, audits, audit_categories, audit_issues)
- `web/lib/db/index.ts` — Database connection singleton
- `web/lib/db/seed.ts` — Seed script with watchmen.io sample data
- `web/app/api/projects/route.ts` — Projects list & create
- `web/app/api/projects/[id]/route.ts` — Project get, update, delete
- `web/app/api/audits/route.ts` — Audits list & create
- `web/app/api/audits/[id]/route.ts` — Audit get, update, delete
- `web/app/api/audits/[id]/stream/route.ts` — SSE streaming endpoint

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List projects with computed audit fields |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/[id]` | Get project with audits |
| PUT | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Delete project (cascades) |
| GET | `/api/audits?projectId=xxx` | List audits (filterable) |
| POST | `/api/audits` | Create new audit |
| GET | `/api/audits/[id]` | Get audit with categories & issues |
| PUT | `/api/audits/[id]` | Update audit |
| DELETE | `/api/audits/[id]` | Delete audit (cascades) |
| GET | `/api/audits/[id]/stream` | SSE progress stream |

## Note for Worker 6 (Audit Engine)

The file `web/app/api/audits/[id]/run/route.ts` was NOT created — it is owned by Worker 6.
