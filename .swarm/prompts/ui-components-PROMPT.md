# Worker Mission: UI Wrapper Components

You are a focused Claude Code agent with one specific task to complete as part of a
parallel development effort. Read your spec carefully. Stay in scope. Commit your work.

## Your Task Spec
@.swarm/specs/ui-components.md

## Project Context
@AGENT.md

## Working Protocol

### Before You Write Any Code
1. Read your task spec completely (it is in `.swarm/specs/ui-components.md`)
2. Read `AGENT.md` for project conventions
3. Read `web/types/index.ts` and `web/types/audit.ts` for type definitions
4. Read `web/lib/utils.ts` for utility functions (cn, getScoreColor, formatScore)
5. Read `web/app/globals.css` for CSS chart color variables
6. Search before implementing: use grep/glob to check if anything already exists

### While Coding
1. Only create files in `web/components/ui/` — do not modify any other files
2. Follow HeroUI v3 compound component API: `Card.Header`, `Card.Body`, `Card.Footer`, `Card.Title`, `Card.Description`
3. Use `Chip` with `color` and `variant` props for badges
4. All chart wrappers must use Recharts `ResponsiveContainer` and theme CSS variables
5. All components must accept `className` prop and merge with `cn()`
6. Add `"use client"` to files that use hooks or browser APIs
7. After each logical unit of work: `git add <specific files> && git commit -m "feat: <what you did>"`

### Key Technical Notes
- HeroUI v3 imports: `import { Card, Chip, Table, Button, Input, Tooltip, Progress } from '@heroui/react'`
- Compound components: `<Card><Card.Header><Card.Title>...</Card.Title></Card.Header><Card.Body>...</Card.Body></Card>`
- Recharts imports: `import { AreaChart, Area, BarChart, Bar, RadarChart, Radar, RadialBarChart, RadialBar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'`
- Chart tooltip styling: dark bg (#18181b), rounded-lg, px-3 py-2, text-sm text-white
- ScoreGauge uses RadialBarChart with RadialBar — startAngle={90}, endAngle={-270} for full circle
- For react-markdown: `import ReactMarkdown from 'react-markdown'` with `remarkGfm` plugin

### After Each Change
1. Check for obvious errors (TypeScript types, missing imports)
2. Verify the change matches your acceptance criteria
3. Commit with a descriptive message

### Signaling Completion
When ALL acceptance criteria in your spec are met:
1. Run: `mkdir -p .claude && touch .claude/.worker-done && echo "ui-components_COMPLETE" > .claude/.worker-done`
2. Output: `<promise>UI_COMPONENTS_COMPLETE</promise>`

If you are blocked and cannot continue:
1. Write details to `BLOCKERS.md`: what you tried, what failed, what's needed to unblock
2. Run: `echo "ui-components_BLOCKED" > .claude/.worker-done`
3. Output: `<promise>UI_COMPONENTS_BLOCKED</promise>`
