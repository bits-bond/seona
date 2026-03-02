# Task: Project Scaffolding & Foundation

## Objective
Set up the Next.js 15 project with HeroUI v3, Tailwind CSS v4, TypeScript configuration, root layout, shared type definitions, and utility functions. This is the foundation that all other workers build upon — it must be merged first.

## Scope

### Create These Files
- `web/package.json` — Dependencies: next, react, react-dom, @heroui/react@beta, @heroui/styles@beta, tailwind-variants, tailwindcss, @tailwindcss/postcss, postcss, recharts, drizzle-orm, postgres, @types/node, @types/react, typescript, eslint, eslint-config-next
- `web/tsconfig.json` — TypeScript config with `@/` path alias mapping to `./`, strict mode, jsx preserve, App Router moduleResolution
- `web/postcss.config.mjs` — PostCSS with `@tailwindcss/postcss` plugin
- `web/next.config.ts` — Next.js config with experimental features as needed
- `web/app/globals.css` — `@import "tailwindcss"; @import "@heroui/styles";` (Tailwind MUST come first), custom CSS variables for chart colors that align with HeroUI theme
- `web/app/layout.tsx` — Root layout with `<html lang="en" suppressHydrationWarning>`, dark mode via `data-theme`, metadata export, globals.css import. NO HeroUIProvider needed in v3.
- `web/app/not-found.tsx` — Simple 404 page
- `web/lib/utils.ts` — Utility functions: `cn()` for className merging (clsx + tailwind-merge), `formatScore()`, `formatDate()`, `getScoreColor()` returning HeroUI color names based on score thresholds
- `web/types/index.ts` — All shared TypeScript interfaces (see Technical Guidance below)
- `web/types/audit.ts` — Audit-specific types with all 7 category definitions
- `web/.env.example` — Template with DATABASE_URL, NEXT_PUBLIC_APP_URL
- `web/.eslintrc.json` — ESLint config extending next/core-web-vitals

### Modify These Files
- `.gitignore` — Add entries: `web/node_modules/`, `web/.next/`, `web/.env`, `web/.env.local`, `web/drizzle/`

### Off-Limits (never touch)
- All files outside `web/` and `.gitignore`
- `skills/`, `agents/`, `seo/`, `scripts/`, `docs/`, `hooks/`, `schema/`
- `README.md`, `install.sh`, `install.ps1`, `uninstall.sh`

## Context

### HeroUI v3 Setup Pattern
HeroUI v3 uses Tailwind CSS v4. The critical setup is:
1. Install `@heroui/react@beta @heroui/styles@beta tailwind-variants tailwindcss @tailwindcss/postcss postcss`
2. In `globals.css`: `@import "tailwindcss";` THEN `@import "@heroui/styles";` (order matters!)
3. In root layout: NO HeroUIProvider wrapper — just render children directly
4. Dark mode: Apply `data-theme="dark"` or `class="dark"` on `<html>` element

### Chart Color CSS Variables
Define CSS variables that align with HeroUI's theme tokens so Recharts charts look consistent:
```css
:root {
  --chart-1: oklch(0.646 0.222 41.116);   /* accent warm */
  --chart-2: oklch(0.6 0.118 184.704);    /* teal */
  --chart-3: oklch(0.398 0.07 227.392);   /* dark blue */
  --chart-4: oklch(0.828 0.189 84.429);   /* yellow */
  --chart-5: oklch(0.769 0.188 70.08);    /* orange */
  --chart-critical: oklch(0.577 0.245 27.325);  /* red/danger */
  --chart-high: oklch(0.554 0.135 66.442);      /* orange/warning */
  --chart-medium: oklch(0.681 0.162 75.834);    /* yellow */
  --chart-low: oklch(0.627 0.194 149.214);      /* green/success */
  --chart-good: oklch(0.627 0.194 149.214);
  --chart-needs-work: oklch(0.554 0.135 66.442);
  --chart-poor: oklch(0.577 0.245 27.325);
}
```

### Shared Types (web/types/index.ts)
```typescript
export interface Project {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  lastAuditScore: number | null;
  lastAuditDate: Date | null;
  auditCount: number;
}

export interface Audit {
  id: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  overallScore: number | null;
  businessType: string | null;
  pagesCrawled: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  fullReportMd: string | null;
  actionPlanMd: string | null;
  createdAt: Date;
}

export interface AuditCategory {
  id: string;
  auditId: string;
  category: CategoryType;
  score: number;
  weight: number;
  weightedScore: number;
  findingsJson: Record<string, unknown> | null;
}

export type CategoryType =
  | 'technical'
  | 'content'
  | 'on_page'
  | 'schema'
  | 'performance'
  | 'images'
  | 'ai_readiness';

export interface AuditIssue {
  id: string;
  auditId: string;
  category: CategoryType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string | null;
  recommendation: string | null;
  orderIndex: number;
}

export const CATEGORY_CONFIG: Record<CategoryType, { label: string; weight: number; color: string; icon: string }> = {
  technical: { label: 'Technical SEO', weight: 25, color: 'var(--chart-1)', icon: 'Settings' },
  content: { label: 'Content Quality', weight: 25, color: 'var(--chart-2)', icon: 'FileText' },
  on_page: { label: 'On-Page SEO', weight: 20, color: 'var(--chart-3)', icon: 'Code' },
  schema: { label: 'Schema / Structured Data', weight: 10, color: 'var(--chart-4)', icon: 'Database' },
  performance: { label: 'Performance (CWV)', weight: 10, color: 'var(--chart-5)', icon: 'Zap' },
  images: { label: 'Images', weight: 5, color: 'var(--chart-1)', icon: 'Image' },
  ai_readiness: { label: 'AI Search Readiness', weight: 5, color: 'var(--chart-2)', icon: 'Bot' },
};

export const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'danger' as const, priority: 0 },
  high: { label: 'High', color: 'warning' as const, priority: 1 },
  medium: { label: 'Medium', color: 'accent' as const, priority: 2 },
  low: { label: 'Low', color: 'default' as const, priority: 3 },
};
```

### Utility Functions (web/lib/utils.ts)
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number | null): string {
  if (score === null) return '—';
  return Math.round(score).toString();
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function getScoreColor(score: number): 'danger' | 'warning' | 'accent' | 'success' {
  if (score < 40) return 'danger';
  if (score < 60) return 'warning';
  if (score < 80) return 'accent';
  return 'success';
}

export function getScoreLabel(score: number): string {
  if (score < 40) return 'Poor';
  if (score < 60) return 'Needs Work';
  if (score < 80) return 'Good';
  return 'Excellent';
}
```

## Acceptance Criteria
- [ ] `cd web && npm install` completes without errors
- [ ] `cd web && npm run dev` starts the Next.js dev server on port 3000
- [ ] Root layout renders with HeroUI v3 styles applied (verify dark mode toggle works by changing data-theme)
- [ ] `@/` path alias works in imports
- [ ] All shared types are exported from `web/types/index.ts` and `web/types/audit.ts`
- [ ] `cn()`, `formatScore()`, `formatDate()`, `getScoreColor()`, `getScoreLabel()` are exported from `web/lib/utils.ts`
- [ ] CSS chart color variables are defined in globals.css for both light and dark themes
- [ ] `.gitignore` updated with web/ entries
- [ ] No TypeScript errors
- [ ] Package includes: clsx, tailwind-merge as dependencies

## Technical Guidance
- Use `npm create next-app@latest web -- --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"` as a starting point, then replace the generated config with HeroUI v3 setup
- The `postcss.config.mjs` should export `{ plugins: { "@tailwindcss/postcss": {} } }`
- Root layout should include basic metadata: title "Claude SEO Dashboard", description
- Add a minimal `web/app/page.tsx` that just says "Dashboard" — Worker 5 will replace this
- Include `lucide-react` in dependencies for icons

## Dependencies
- **Requires output from**: none (this is the foundation)
- **Provides to**: ALL other workers — project config, types, utilities, CSS variables

## Completion Signal
When **all acceptance criteria are met**, output:
`<promise>SCAFFOLD_FOUNDATION_COMPLETE</promise>`

If blocked and unable to continue, write details to `BLOCKERS.md` then output:
`<promise>SCAFFOLD_FOUNDATION_BLOCKED</promise>`
