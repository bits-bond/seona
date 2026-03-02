# Worker Mission: Layout System & Navigation

You are a focused Claude Code agent with one specific task to complete as part of a
parallel development effort. Read your spec carefully. Stay in scope. Commit your work.

## Your Task Spec
@.swarm/specs/layout-navigation.md

## Project Context
@AGENT.md

## Working Protocol

### Before You Write Any Code
1. Read your task spec completely (it is in `.swarm/specs/layout-navigation.md`)
2. Read `AGENT.md` for project conventions
3. Read `web/types/index.ts` for the `Project` interface
4. Read `web/lib/utils.ts` for `cn()` and `getScoreColor()` utilities
5. Search before implementing: use grep/glob to check if anything already exists

### While Coding
1. Only create files in `web/components/layout/` — do not modify any other files
2. The AppShell is a component that pages import — do NOT modify `web/app/layout.tsx` (Worker 1 owns it)
3. Use `"use client"` on components that use hooks (sidebar, theme toggle)
4. Use `lucide-react` icons: LayoutDashboard, FolderOpen, PlusCircle, ChevronLeft, ChevronRight, Sun, Moon, Menu, X
5. After each logical unit of work: `git add <specific files> && git commit -m "feat: <what you did>"`

### Key Technical Notes
- Floating sidebar: `position: fixed`, `top: 12px`, `left: 12px`, `bottom: 12px`, rounded-2xl, surface bg, shadow
- Sidebar width: 260px expanded, 64px collapsed, CSS transition on width
- Collapse state in localStorage key `sidebar-collapsed`
- Theme state in localStorage key `theme`, applies `data-theme` on `<html>`
- Mobile (<768px): sidebar hidden, hamburger in navbar opens overlay
- Top navbar: sticky top, height 64px, left margin matches sidebar width
- Content area: margin-left matches sidebar, transitions with sidebar
- Project list in sidebar: fetch from `/api/projects`, show name + score color dot
- Use HeroUI v3 imports: `import { Button, Input, Link } from '@heroui/react'`
- Use `next/link` for navigation, `next/navigation` for `usePathname()`

### After Each Change
1. Check for obvious errors (TypeScript types, missing imports)
2. Verify the change matches your acceptance criteria
3. Commit with a descriptive message

### Signaling Completion
When ALL acceptance criteria in your spec are met:
1. Run: `mkdir -p .claude && touch .claude/.worker-done && echo "layout-navigation_COMPLETE" > .claude/.worker-done`
2. Output: `<promise>LAYOUT_NAVIGATION_COMPLETE</promise>`

If you are blocked and cannot continue:
1. Write details to `BLOCKERS.md`: what you tried, what failed, what's needed to unblock
2. Run: `echo "layout-navigation_BLOCKED" > .claude/.worker-done`
3. Output: `<promise>LAYOUT_NAVIGATION_BLOCKED</promise>`
