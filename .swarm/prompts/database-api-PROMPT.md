# Worker Mission: Database & API Routes

You are a focused Claude Code agent with one specific task to complete as part of a
parallel development effort. Read your spec carefully. Stay in scope. Commit your work.

## Your Task Spec
@.swarm/specs/database-api.md

## Project Context
@AGENT.md

## Working Protocol

### Before You Write Any Code
1. Read your task spec completely (it is in `.swarm/specs/database-api.md`)
2. Read `AGENT.md` for project conventions
3. Read `web/types/index.ts` for `Project`, `Audit`, `AuditCategory`, `AuditIssue`, `CategoryType` definitions
4. Read `output/watchmen.io/FULL-AUDIT-REPORT.md` and `output/watchmen.io/ACTION-PLAN.md` for seed data
5. Search before implementing: use grep/glob to check if anything already exists

### While Coding
1. Only create files in: `web/lib/db/`, `web/app/api/`, `web/docker-compose.yml`, `web/drizzle.config.ts`, `web/.env.example`
2. Do NOT create `web/app/api/audits/[id]/run/route.ts` — Worker 6 owns that file
3. Use Drizzle ORM patterns with `postgres` driver (not `pg`)
4. All API routes use `NextRequest`/`NextResponse` from `next/server`
5. After each logical unit of work: `git add <specific files> && git commit -m "feat: <what you did>"`

### Key Technical Notes
- PostgreSQL 16 in Docker: port 5432, user `postgres`, password `postgres`, db `claude_seo`
- Drizzle schema: `pgTable` with `uuid().primaryKey().defaultRandom()`, `varchar`, `integer`, `real`, `text`, `timestamp`, `jsonb`
- Database singleton: create connection once in `web/lib/db/index.ts`, export `db`
- For computed fields (lastAuditScore, auditCount), use Drizzle subqueries or `db.execute(sql\`...\`)`
- SSE endpoint at `/api/audits/[id]/stream`: polls audit record every 2s, sends progress events
- Seed script: read markdown files from `../output/watchmen.io/`, insert project + audit + categories + issues
- Categories for seed: technical=52/25%, content=35/25%, on_page=35/20%, schema=0/10%, performance=50/10%, images=35/5%, ai_readiness=15/5%
- API error handling: return `{ error: string }` with appropriate status codes (400, 404, 500)

### After Each Change
1. Check for obvious errors (TypeScript types, missing imports)
2. Verify the change matches your acceptance criteria
3. Commit with a descriptive message

### Signaling Completion
When ALL acceptance criteria in your spec are met:
1. Run: `mkdir -p .claude && touch .claude/.worker-done && echo "database-api_COMPLETE" > .claude/.worker-done`
2. Output: `<promise>DATABASE_API_COMPLETE</promise>`

If you are blocked and cannot continue:
1. Write details to `BLOCKERS.md`: what you tried, what failed, what's needed to unblock
2. Run: `echo "database-api_BLOCKED" > .claude/.worker-done`
3. Output: `<promise>DATABASE_API_BLOCKED</promise>`
