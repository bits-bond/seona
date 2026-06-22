"use client";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  accent?: string;
  label?: string;
}

export function ScoreGauge({ score, size = 180, accent = "#e05a33", label }: ScoreGaugeProps) {
  const stroke = 14;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  const color =
    score >= 80 ? "#2a9d5a"
    : score >= 60 ? "#88b04b"
    : score >= 40 ? "#d4a843"
    : score >= 20 ? "#cc7722"
    : "#c1121f";
  const cx = size / 2;
  const cy = size / 2;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text
          x={cx}
          y={cy + size * 0.04}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize={size * 0.28}
          fontWeight={700}
          fill="currentColor"
          className="text-default-900"
        >
          {Math.round(score)}
        </text>
        <text
          x={cx}
          y={cy + size * 0.2}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize={size * 0.07}
          fontWeight={500}
          fill="currentColor"
          className="text-default-500"
        >
          / 100
        </text>
        <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="none" stroke={accent} strokeWidth="1" opacity={0.08} />
      </svg>
      {label && <div className="mt-1 text-sm font-medium">{label}</div>}
    </div>
  );
}
