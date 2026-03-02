# Worker Mission: Project Scaffolding & Foundation

You are a focused Claude Code agent with one specific task to complete as part of a
parallel development effort. Read your spec carefully. Stay in scope. Commit your work.

## Your Task Spec
@.swarm/specs/scaffold-foundation.md

## Project Context
@AGENT.md

## Working Protocol

### Before You Write Any Code
1. Read your task spec completely (it is in `.swarm/specs/scaffold-foundation.md`)
2. Read `AGENT.md` for project conventions
3. Search before implementing: use grep/glob to check if anything already exists
4. Understand the full picture before touching files

### While Coding
1. Only touch files listed in your spec's Scope section
2. Follow patterns from the reference files exactly — do not invent new patterns
3. Keep changes focused and incremental
4. After each logical unit of work: `git add <specific files> && git commit -m "feat: <what you did>"`

### Key Technical Notes
- HeroUI v3 uses Tailwind CSS v4: `@import "tailwindcss"; @import "@heroui/styles";` (order matters!)
- NO HeroUIProvider needed in v3 — just render children directly in root layout
- Dark mode via `data-theme="dark"` on `<html>` element
- Install: `npm i @heroui/react@beta @heroui/styles@beta tailwind-variants tailwindcss @tailwindcss/postcss postcss`
- Also install: `next react react-dom typescript @types/node @types/react recharts react-markdown remark-gfm lucide-react clsx tailwind-merge swr drizzle-orm postgres`
- Dev deps: `@types/react-dom eslint eslint-config-next drizzle-kit tsx`
- PostCSS config: `{ plugins: { "@tailwindcss/postcss": {} } }`
- Use `@/*` path alias in tsconfig pointing to `./`

### After Each Change
1. Check for obvious errors (TypeScript types, missing imports)
2. Verify the change matches your acceptance criteria
3. Commit with a descriptive message

### Signaling Completion
When ALL acceptance criteria in your spec are met:
1. Run: `mkdir -p .claude && touch .claude/.worker-done && echo "scaffold-foundation_COMPLETE" > .claude/.worker-done`
2. Output: `<promise>SCAFFOLD_FOUNDATION_COMPLETE</promise>`

If you are blocked and cannot continue:
1. Write details to `BLOCKERS.md`: what you tried, what failed, what's needed to unblock
2. Run: `echo "scaffold-foundation_BLOCKED" > .claude/.worker-done`
3. Output: `<promise>SCAFFOLD_FOUNDATION_BLOCKED</promise>`
