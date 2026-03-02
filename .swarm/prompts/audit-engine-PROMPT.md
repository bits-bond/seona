# Worker Mission: Audit Engine (Claude Code CLI Integration)

You are a focused Claude Code agent with one specific task to complete as part of a
parallel development effort. Read your spec carefully. Stay in scope. Commit your work.

## Your Task Spec
@.swarm/specs/audit-engine.md

## Project Context
@AGENT.md

## Working Protocol

### Before You Write Any Code
1. Read your task spec completely (it is in `.swarm/specs/audit-engine.md`)
2. Read `AGENT.md` for project conventions
3. Read `web/types/index.ts` for type definitions
4. Read `output/watchmen.io/FULL-AUDIT-REPORT.md` — this is what the CLI produces, your parser must handle this format
5. Read `output/watchmen.io/ACTION-PLAN.md` — same, parser must extract issues from this
6. Read `seo/SKILL.md` — understand the scoring methodology and category weights
7. Search before implementing: use grep/glob to check if anything already exists

### While Coding
1. Only create files in: `web/lib/audit-engine/`, `web/components/audit/`, `web/app/api/audits/[id]/run/`
2. Do NOT modify `web/app/api/audits/[id]/route.ts` or `web/app/api/audits/[id]/stream/route.ts` (Worker 4 owns those)
3. The runner uses `child_process.spawn('claude', [...])` — NOT the Claude Agent SDK
4. The CLI runs in the claude-seo project root (parent of web/): `path.resolve(process.cwd(), '..')`
5. After each logical unit of work: `git add <specific files> && git commit -m "feat: <what you did>"`

### Key Technical Notes
- Claude CLI invocation: `spawn('claude', ['--print', '--dangerously-skip-permissions', '-p', prompt], { cwd: projectRoot })`
- Prompt to send: `"Run /seo-audit ${url}. Save all output files to output/${domain}/"`
- Progress detection from stdout: scan for keywords like "Fetching", "subagent", "Technical SEO", "Content quality", "Schema", "Performance", "report", "ACTION-PLAN"
- Output files location: `../output/<domain>/FULL-AUDIT-REPORT.md` and `../output/<domain>/ACTION-PLAN.md`
- Parser regex for overall score: `/## SEO Health Score:\s*(\d+)\/100/`
- Parser regex for categories: `/\|\s*(.+?)\s*\|\s*(\d+)%\s*\|\s*(\d+)\/100\s*\|\s*([\d.]+)\s*\|/g`
- Action plan severity mapping: `## CRITICAL` → critical, `## HIGH` → high, `## MEDIUM` → medium, `## LOW` → low
- SSE client: `new EventSource('/api/audits/${auditId}/stream')` — listen for 'progress' and 'complete' events
- The `/api/audits/[id]/run` endpoint should return 202 immediately and run the audit async
- Use `"use client"` on form and progress components
- Handle missing `claude` CLI gracefully: check `which claude` before spawning

### After Each Change
1. Check for obvious errors (TypeScript types, missing imports)
2. Verify the change matches your acceptance criteria
3. Commit with a descriptive message

### Signaling Completion
When ALL acceptance criteria in your spec are met:
1. Run: `mkdir -p .claude && touch .claude/.worker-done && echo "audit-engine_COMPLETE" > .claude/.worker-done`
2. Output: `<promise>AUDIT_ENGINE_COMPLETE</promise>`

If you are blocked and cannot continue:
1. Write details to `BLOCKERS.md`: what you tried, what failed, what's needed to unblock
2. Run: `echo "audit-engine_BLOCKED" > .claude/.worker-done`
3. Output: `<promise>AUDIT_ENGINE_BLOCKED</promise>`
