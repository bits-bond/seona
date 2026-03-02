# Task: Layout System & Navigation

## Objective
Create the app shell layout with a floating sidebar for project navigation, a top navbar with breadcrumbs and theme toggle, and a responsive grid layout system. These layout components wrap all pages and provide consistent navigation throughout the dashboard.

## Scope

### Create These Files
- `web/components/layout/sidebar.tsx` — Floating sidebar with logo, project list, nav links, collapse toggle
- `web/components/layout/top-navbar.tsx` — Top navigation bar with breadcrumbs, theme toggle (light/dark), and user area
- `web/components/layout/app-shell.tsx` — Main layout wrapper that composes sidebar + navbar + content area with proper grid
- `web/components/layout/breadcrumbs.tsx` — Dynamic breadcrumb component that reads the current route
- `web/components/layout/page-header.tsx` — Reusable page header with title, description, and action buttons
- `web/components/layout/theme-toggle.tsx` — Light/dark mode toggle button that sets `data-theme` on `<html>`
- `web/components/layout/sidebar-project-list.tsx` — Project list component used within sidebar (fetches projects from API)
- `web/components/layout/index.ts` — Barrel export

### Read for Patterns (do not modify)
- `web/types/index.ts` — `Project` interface for sidebar project list
- `web/lib/utils.ts` — `cn()` for className merging, `getScoreColor()` for project score indicators

### Off-Limits (never touch)
- All files outside `web/components/layout/`
- `web/app/layout.tsx` (Worker 1 owns root layout — this worker provides the AppShell component that pages import)
- All existing claude-seo files

## Context

### Layout Architecture
```
┌──────────────────────────────────────────────────────┐
│  TopNavbar (sticky top, full width)                  │
│  [Logo] [Breadcrumbs............] [ThemeToggle] [?]  │
├──────────┬───────────────────────────────────────────┤
│ Sidebar  │  Main Content Area                        │
│ (floating│  ┌─────────────────────────────────────┐  │
│  left,   │  │ PageHeader                          │  │
│  fixed)  │  │ [Title] [Description]    [Actions]  │  │
│          │  ├─────────────────────────────────────┤  │
│ [Logo]   │  │                                     │  │
│ ──────── │  │  Page Content (children)            │  │
│ Dashboard│  │                                     │  │
│ Projects │  │                                     │  │
│ New Audit│  │                                     │  │
│ ──────── │  │                                     │  │
│ PROJECTS │  │                                     │  │
│ • Site A │  │                                     │  │
│ • Site B │  │                                     │  │
│ • Site C │  └─────────────────────────────────────┘  │
│          │                                           │
│ [Collapse│                                           │
│  Toggle] │                                           │
└──────────┴───────────────────────────────────────────┘
```

### Sidebar Specification
```tsx
interface SidebarProps {
  className?: string;
}
```
- **Position**: Fixed left, full height, z-40
- **Width**: 260px expanded, 64px collapsed (icon-only mode)
- **Style**: Floating effect — `margin: 12px`, `border-radius: 16px`, background with subtle border, shadow
- **Sections**:
  1. Logo/brand area at top ("Claude SEO" with a small icon)
  2. Main navigation links: Dashboard (home icon), Projects (folder icon), New Audit (plus-circle icon)
  3. Divider
  4. "Projects" heading with scrollable list of recent projects (fetched from `/api/projects`)
  5. Each project shows: name (truncated), small score badge with color
  6. Collapse toggle button at bottom
- **State**: `collapsed` boolean stored in localStorage
- **Mobile**: Hidden by default, slides in from left as overlay on mobile (< 768px)
- Use `"use client"` directive

### Top Navbar Specification
```tsx
interface TopNavbarProps {
  className?: string;
}
```
- **Position**: Sticky top, accounts for sidebar width
- **Height**: 64px
- **Content**: Breadcrumbs on left, ThemeToggle + optional actions on right
- **Style**: Background matching surface color, subtle bottom border
- Use HeroUI `Navbar` compound component if available, or build custom

### Breadcrumbs Specification
```tsx
interface BreadcrumbItem {
  label: string;
  href?: string;  // if undefined, it's the current page (not a link)
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}
```
- Show "Dashboard" as root, then path segments
- Use `next/link` for navigation
- Separator: `/` or `>` chevron
- Current page (last item) is bold, not a link

### PageHeader Specification
```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;  // buttons to render on the right
}
```

### Theme Toggle
- Reads and sets `data-theme` attribute on `<html>` element
- Persists preference in localStorage under key `theme`
- Options: `light` (default) and `dark` (use `data-theme="zinc-dark"` or just `"dark"`)
- Icon: Sun for light, Moon for dark
- Use HeroUI `Button` with `variant="tertiary"` and icon-only

### AppShell Usage Pattern
The AppShell is NOT placed in root layout (Worker 1's territory). Instead, pages import and use it:
```tsx
// In any page file:
import { AppShell } from '@/components/layout';

export default function DashboardPage() {
  return (
    <AppShell
      breadcrumbs={[{ label: 'Dashboard' }]}
      pageTitle="Dashboard"
      pageDescription="Overview of all your SEO projects"
    >
      {/* page content */}
    </AppShell>
  );
}
```
This way Worker 3 doesn't need to modify the root layout.

## Acceptance Criteria
- [ ] Sidebar renders with logo, nav links, project list section, and collapse toggle
- [ ] Sidebar collapse state persists in localStorage and toggles between 260px and 64px
- [ ] Sidebar shows project names with score color indicators (fetches from `/api/projects`)
- [ ] TopNavbar is sticky with breadcrumbs on left and theme toggle on right
- [ ] Breadcrumbs render clickable links for parent routes, bold text for current page
- [ ] ThemeToggle switches between light and dark, persists in localStorage
- [ ] PageHeader renders title, optional description, and optional action buttons
- [ ] AppShell composes sidebar + navbar + content area with proper spacing
- [ ] On mobile (< 768px), sidebar becomes an overlay triggered by hamburger menu in navbar
- [ ] All components use `cn()` for className merging
- [ ] Barrel export from `index.ts`
- [ ] No TypeScript errors
- [ ] Uses `lucide-react` icons: `LayoutDashboard`, `FolderOpen`, `PlusCircle`, `ChevronLeft`, `ChevronRight`, `Sun`, `Moon`, `Menu`, `X`

## Technical Guidance
- Use `"use client"` on components that use hooks (sidebar, theme toggle)
- For the floating sidebar effect: `position: fixed`, `top: 12px`, `left: 12px`, `bottom: 12px`, `border-radius: 16px`, background surface color, subtle border, box-shadow
- For the collapse animation, use CSS transitions on width: `transition: width 200ms ease-in-out`
- The project list in sidebar should use `useSWR` or `useEffect` + `fetch` to load from `/api/projects`. Handle loading state with a few skeleton lines.
- Mobile sidebar: add a `<div>` overlay backdrop when open, close on backdrop click or `Escape` key
- Content area should have `margin-left` matching sidebar width (260px or 64px) with transition

## Dependencies
- **Requires output from**: `scaffold-foundation` — needs types, utils, package.json
- **Provides to**: `dashboard-pages` — `AppShell`, `PageHeader` used by all pages

## Completion Signal
When **all acceptance criteria are met**, output:
`<promise>LAYOUT_NAVIGATION_COMPLETE</promise>`

If blocked and unable to continue, write details to `BLOCKERS.md` then output:
`<promise>LAYOUT_NAVIGATION_BLOCKED</promise>`
