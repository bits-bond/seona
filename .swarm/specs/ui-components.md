# Task: UI Wrapper Components

## Objective
Create a library of reusable wrapper components for Recharts and HeroUI v3 that enforce consistent theming across the dashboard. These components abstract chart configuration, score visualization, data tables, and loading states so that page-level components never interact with raw Recharts or complex HeroUI patterns directly.

## Scope

### Create These Files
- `web/components/ui/score-gauge.tsx` — Circular score indicator (0-100) using Recharts RadialBarChart, color-coded by score threshold
- `web/components/ui/stat-card.tsx` — HeroUI Card wrapper for displaying a metric with label, value, trend indicator, and icon
- `web/components/ui/chart-area.tsx` — Themed Recharts AreaChart wrapper with HeroUI-consistent colors, responsive container, tooltip styling
- `web/components/ui/chart-bar.tsx` — Themed Recharts BarChart wrapper for category score comparisons
- `web/components/ui/chart-radar.tsx` — Themed Recharts RadarChart wrapper for multi-category visualization
- `web/components/ui/data-table.tsx` — Generic sortable/filterable table using HeroUI Table compound components with pagination
- `web/components/ui/severity-badge.tsx` — HeroUI Chip wrapper that maps severity levels (critical/high/medium/low) to colors
- `web/components/ui/score-badge.tsx` — HeroUI Chip wrapper that shows a score with color based on threshold
- `web/components/ui/loading-skeleton.tsx` — Skeleton loading states for cards, tables, charts, and pages
- `web/components/ui/empty-state.tsx` — Centered empty state with icon, title, description, and optional CTA button
- `web/components/ui/markdown-renderer.tsx` — Renders markdown content (audit reports) with proper styling using react-markdown
- `web/components/ui/index.ts` — Barrel export for all UI components

### Read for Patterns (do not modify)
- `web/types/index.ts` — Type definitions for `CategoryType`, `SEVERITY_CONFIG`, `CATEGORY_CONFIG`
- `web/lib/utils.ts` — `cn()`, `getScoreColor()`, `formatScore()` utilities
- `web/app/globals.css` — CSS chart color variables (`--chart-1` through `--chart-5`, `--chart-critical`, etc.)

### Off-Limits (never touch)
- All files outside `web/components/ui/`
- `web/package.json` (Worker 1 owns this — declare needed packages in spec; they'll be added during merge)
- All existing claude-seo files

## Context

### HeroUI v3 Component API
HeroUI v3 uses **compound components**. Key patterns:
```tsx
// Card
<Card className="...">
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Desc</Card.Description>
  </Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Footer</Card.Footer>
</Card>

// Table
<Table aria-label="...">
  <Table.Header>
    <Table.Column>NAME</Table.Column>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>Value</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>

// Chip
<Chip color="danger" variant="soft" size="sm">Critical</Chip>

// Tooltip
<Tooltip content="Details here">
  <span>Hover me</span>
</Tooltip>
```

### Recharts Theming Pattern
All chart wrappers must:
1. Use `ResponsiveContainer` for width/height
2. Read colors from CSS variables (defined in globals.css) using `getComputedStyle` or hardcode the oklch values
3. Style tooltips with dark background, rounded corners, matching the HeroUI overlay style
4. Use `recharts` named imports: `AreaChart`, `Area`, `BarChart`, `Bar`, `RadarChart`, `Radar`, `RadialBarChart`, `RadialBar`, `PolarGrid`, `PolarAngleAxis`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`

### Score Gauge Specification
The ScoreGauge is the hero component — a large circular gauge showing the overall SEO score:
```tsx
interface ScoreGaugeProps {
  score: number;        // 0-100
  size?: 'sm' | 'md' | 'lg';  // sm=120px, md=200px, lg=280px
  showLabel?: boolean;  // "Poor", "Needs Work", "Good", "Excellent"
  animated?: boolean;   // animate on mount
}
```
Use `RadialBarChart` with a single `RadialBar`. Background track in muted color, fill in score color. Center text shows the numeric score.

### Data Table Specification
```tsx
interface DataTableProps<T> {
  data: T[];
  columns: {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
  }[];
  pageSize?: number;     // default 10
  searchable?: boolean;  // adds search input
  searchKeys?: string[]; // which fields to search
  emptyMessage?: string;
}
```
Use HeroUI `Table` compound components. Add local state for sorting (column + direction) and pagination (current page). If `searchable`, add a HeroUI `Input` above the table.

### Additional Dependencies Needed
These packages should be in `web/package.json` (Worker 1 should include them, but list here for reference):
- `recharts` — charting library
- `react-markdown` — markdown rendering
- `remark-gfm` — GitHub Flavored Markdown support for tables
- `lucide-react` — icons

## Acceptance Criteria
- [ ] All 11 component files created with proper TypeScript typing
- [ ] `ScoreGauge` renders a circular gauge with correct color at scores 20, 50, 75, 95
- [ ] `StatCard` displays icon, label, value, and optional trend arrow
- [ ] `ChartArea`, `ChartBar`, `ChartRadar` all use `ResponsiveContainer` and theme colors
- [ ] `DataTable` supports sorting by clicking column headers, pagination, and optional search
- [ ] `SeverityBadge` maps `critical`→danger/red, `high`→warning/orange, `medium`→accent, `low`→default
- [ ] `ScoreBadge` shows color based on `getScoreColor()` threshold
- [ ] `LoadingSkeleton` has variants: `card`, `table`, `chart`, `page`
- [ ] `EmptyState` renders icon, title, description, and optional action button
- [ ] `MarkdownRenderer` renders markdown with proper heading styles, tables, code blocks, and lists
- [ ] Barrel export from `index.ts` exports all components
- [ ] All components accept `className` prop and merge it with `cn()`
- [ ] No TypeScript errors

## Technical Guidance
- For the ScoreGauge, use `RadialBarChart` with `startAngle={180}` and `endAngle={0}` for a semi-circle, or `startAngle={90}` and `endAngle={-270}` for a full circle. The background track can be a second RadialBar with 100% value and muted color.
- For chart tooltip styling, create a shared `ChartTooltip` internal component with dark bg, rounded, shadow.
- The MarkdownRenderer should use `react-markdown` with `remarkGfm` plugin. Style headings, tables, lists, and code blocks using Tailwind classes.
- Components should be "use client" where they use hooks or browser APIs.
- Each component should have a clear JSDoc comment explaining its purpose and props.

## Dependencies
- **Requires output from**: `scaffold-foundation` — needs types, utils, CSS variables, package.json
- **Provides to**: `dashboard-pages` — all chart and display components used in pages

## Completion Signal
When **all acceptance criteria are met**, output:
`<promise>UI_COMPONENTS_COMPLETE</promise>`

If blocked and unable to continue, write details to `BLOCKERS.md` then output:
`<promise>UI_COMPONENTS_BLOCKED</promise>`
