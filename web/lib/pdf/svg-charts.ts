const CHART_COLORS = ['#e05a33', '#2a9d8f', '#264653', '#e9c46a', '#f4a261', '#c1121f', '#cc7722'];

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
export function renderScoreGaugeSVG(score: number, size: number = 200): string {
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
      stroke="#2a2a3e"
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
      fill="#e8e8ed"
      font-family="-apple-system, sans-serif"
      font-size="${size * 0.18}px"
      font-weight="800"
    >${Math.round(score)}</text>
    <text
      x="${center}" y="${center + size * 0.1}"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="#8888a0"
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
  size: number = 300,
): string {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;
  const n = categories.length;

  // Helper to compute point on axis
  const point = (i: number, r: number) => {
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
        const p = point(i, radius * frac);
        return `${p.x},${p.y}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="#2a2a3e" stroke-width="1" />`;
    })
    .join('\n    ');

  // Axis lines
  const axisLines = Array.from({ length: n }, (_, i) => {
    const p = point(i, radius);
    return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="#2a2a3e" stroke-width="1" />`;
  }).join('\n    ');

  // Data polygon
  const dataPoints = categories
    .map((cat, i) => {
      const p = point(i, (cat.score / 100) * radius);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  // Labels at outer edge
  const labels = categories
    .map((cat, i) => {
      const p = point(i, radius + 20);
      const anchor =
        Math.abs(p.x - cx) < 5
          ? 'middle'
          : p.x > cx
            ? 'start'
            : 'end';
      // Truncate long labels
      const text = cat.label.length > 18 ? cat.label.substring(0, 16) + '...' : cat.label;
      return `<text x="${p.x}" y="${p.y}" text-anchor="${anchor}" dominant-baseline="middle" fill="#8888a0" font-family="-apple-system, sans-serif" font-size="9px">${text}</text>`;
    })
    .join('\n    ');

  // Score dots
  const dots = categories
    .map((cat, i) => {
      const p = point(i, (cat.score / 100) * radius);
      return `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#e05a33" />`;
    })
    .join('\n    ');

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}
    ${axisLines}
    <polygon points="${dataPoints}" fill="rgba(224, 90, 51, 0.2)" stroke="#e05a33" stroke-width="2" />
    ${dots}
    ${labels}
  </svg>`;
}

/**
 * Render horizontal bar chart as a self-contained SVG string.
 */
export function renderBarChartSVG(
  categories: { label: string; score: number }[],
  width: number = 500,
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
      <text x="${labelWidth - 8}" y="${y + barHeight / 2 + 1}" text-anchor="end" dominant-baseline="middle" fill="#c8c8d0" font-family="-apple-system, sans-serif" font-size="10px">${cat.label}</text>
      <rect x="${labelWidth}" y="${y}" width="${barAreaWidth}" height="${barHeight}" rx="4" fill="#1a1a2e" />
      <rect x="${labelWidth}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${color}" opacity="0.85" />
      <text x="${labelWidth + barAreaWidth + 8}" y="${y + barHeight / 2 + 1}" text-anchor="start" dominant-baseline="middle" fill="#e8e8ed" font-family="-apple-system, sans-serif" font-size="11px" font-weight="600">${cat.score}</text>`;
    })
    .join('');

  return `<svg width="${width}" height="${chartHeight}" viewBox="0 0 ${width} ${chartHeight}" xmlns="http://www.w3.org/2000/svg">
    ${bars}
  </svg>`;
}
