import type { PdfColorPalette } from './types';

export const CHART_COLORS = ['#e05a33', '#2a9d8f', '#264653', '#e9c46a', '#f4a261', '#c1121f', '#cc7722'];

const SCORE_COLORS = {
  poor: '#c1121f',
  needsWork: '#cc7722',
  medium: '#d4a843',
  good: '#2a9d5a',
};

function getScoreColor(score: number): string {
  if (score < 40) return SCORE_COLORS.poor;
  if (score < 60) return SCORE_COLORS.needsWork;
  if (score < 80) return SCORE_COLORS.medium;
  return SCORE_COLORS.good;
}

/**
 * Render a circular score gauge as a self-contained SVG string.
 * Uses stroke-dasharray/dashoffset on a <circle> to draw the arc.
 */
export function renderScoreGaugeSVG(score: number, size: number, p: PdfColorPalette): string {
  const center = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - score / 100);
  const color = getScoreColor(score);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <!-- Background track -->
    <circle
      cx="${center}" cy="${center}" r="${radius}"
      fill="none"
      stroke="${p.border}"
      stroke-width="${strokeWidth}"
    />
    <!-- Score arc -->
    <circle
      cx="${center}" cy="${center}" r="${radius}"
      fill="none"
      stroke="${color}"
      stroke-width="${strokeWidth}"
      stroke-linecap="round"
      stroke-dasharray="${circumference}"
      stroke-dashoffset="${dashoffset}"
      transform="rotate(-90 ${center} ${center})"
    />
    <!-- Score text -->
    <text
      x="${center}" y="${center - 4}"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="${p.text}"
      font-family="-apple-system, sans-serif"
      font-size="${size * 0.18}px"
      font-weight="800"
    >${Math.round(score)}</text>
    <text
      x="${center}" y="${center + size * 0.1}"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="${p.textMuted}"
      font-family="-apple-system, sans-serif"
      font-size="${size * 0.06}px"
    >/100</text>
  </svg>`;
}

/**
 * Render a radar chart as a self-contained SVG string.
 * 7 axes for SEO categories, polygon for scores.
 */
export function renderRadarChartSVG(
  categories: { label: string; score: number }[],
  size: number,
  p: PdfColorPalette,
): string {
  // Add padding around the chart for labels (proportional to chart size)
  const labelPad = Math.round(size * 0.2);
  const totalSize = size + labelPad * 2;
  const cx = totalSize / 2;
  const cy = totalSize / 2;
  const radius = size * 0.35;
  const n = categories.length;

  // Helper to compute point on axis
  const pt = (i: number, r: number) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];
  const gridLines = rings
    .map((frac) => {
      const pts = Array.from({ length: n }, (_, i) => {
        const point = pt(i, radius * frac);
        return `${point.x},${point.y}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="${p.border}" stroke-width="1" />`;
    })
    .join('\n    ');

  // Axis lines
  const axisLines = Array.from({ length: n }, (_, i) => {
    const point = pt(i, radius);
    return `<line x1="${cx}" y1="${cy}" x2="${point.x}" y2="${point.y}" stroke="${p.border}" stroke-width="1" />`;
  }).join('\n    ');

  // Data polygon
  const dataPoints = categories
    .map((cat, i) => {
      const point = pt(i, (cat.score / 100) * radius);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  // Labels at outer edge — no truncation, use full names
  const labels = categories
    .map((cat, i) => {
      const point = pt(i, radius + 24);
      const anchor =
        Math.abs(point.x - cx) < 5
          ? 'middle'
          : point.x > cx
            ? 'start'
            : 'end';
      return `<text x="${point.x}" y="${point.y}" text-anchor="${anchor}" dominant-baseline="middle" fill="${p.textMuted}" font-family="-apple-system, sans-serif" font-size="9px">${cat.label}</text>`;
    })
    .join('\n    ');

  // Score dots
  const dots = categories
    .map((cat, i) => {
      const point = pt(i, (cat.score / 100) * radius);
      return `<circle cx="${point.x}" cy="${point.y}" r="3" fill="${p.accent}" />`;
    })
    .join('\n    ');

  return `<svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}
    ${axisLines}
    <polygon points="${dataPoints}" fill="rgba(224, 90, 51, 0.2)" stroke="${p.accent}" stroke-width="2" />
    ${dots}
    ${labels}
  </svg>`;
}

/**
 * Render horizontal bar chart as a self-contained SVG string.
 */
export function renderBarChartSVG(
  categories: { label: string; score: number }[],
  width: number,
  p: PdfColorPalette,
  height?: number,
): string {
  const barHeight = 28;
  const barGap = 8;
  const labelWidth = 160;
  const scoreWidth = 50;
  const chartHeight = height ?? categories.length * (barHeight + barGap) + 20;
  const barAreaWidth = width - labelWidth - scoreWidth - 20;

  const bars = categories
    .map((cat, i) => {
      const y = i * (barHeight + barGap) + 10;
      const barWidth = (cat.score / 100) * barAreaWidth;
      const color = CHART_COLORS[i % CHART_COLORS.length];

      return `
      <text x="${labelWidth - 8}" y="${y + barHeight / 2 + 1}" text-anchor="end" dominant-baseline="middle" fill="${p.textSecondary}" font-family="-apple-system, sans-serif" font-size="10px">${cat.label}</text>
      <rect x="${labelWidth}" y="${y}" width="${barAreaWidth}" height="${barHeight}" rx="4" fill="${p.tableHeaderBg}" />
      <rect x="${labelWidth}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${color}" opacity="0.85" />
      <text x="${labelWidth + barAreaWidth + 8}" y="${y + barHeight / 2 + 1}" text-anchor="start" dominant-baseline="middle" fill="${p.text}" font-family="-apple-system, sans-serif" font-size="11px" font-weight="600">${cat.score}</text>`;
    })
    .join('');

  return `<svg width="${width}" height="${chartHeight}" viewBox="0 0 ${width} ${chartHeight}" xmlns="http://www.w3.org/2000/svg">
    ${bars}
  </svg>`;
}

/**
 * Render a simple horizontal progress bar as SVG.
 */
export function renderProgressBarSVG(
  score: number,
  width: number,
  height: number,
  color: string,
  p: PdfColorPalette,
): string {
  const fillWidth = (Math.min(100, Math.max(0, score)) / 100) * width;
  const r = height / 2;
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${width}" height="${height}" rx="${r}" fill="${p.border}" />
    <rect x="0" y="0" width="${fillWidth}" height="${height}" rx="${r}" fill="${color}" />
  </svg>`;
}

/** Simple 16x16 SVG icons for categories (inline path-based). */
const CATEGORY_ICONS: Record<string, string> = {
  // Gear icon
  technical: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  // File text icon
  content: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  // Code icon
  on_page: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  // Database icon
  schema: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  // Zap icon
  performance: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  // Image icon
  images: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  // Bot/sparkle icon
  ai_readiness: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
};

export function getCategoryIcon(category: string, color: string): string {
  const svg = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.technical;
  return svg.replace('currentColor', color);
}
