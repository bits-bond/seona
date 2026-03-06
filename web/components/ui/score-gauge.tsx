"use client";

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";
import { cn, getScoreColor } from "@/lib/utils";

const SIZE_MAP = {
  sm: 120,
  md: 200,
  lg: 280,
} as const;

const SCORE_COLORS: Record<string, string> = {
  danger: "var(--chart-poor)",
  warning: "var(--chart-needs-work)",
  accent: "var(--chart-medium)",
  success: "var(--chart-good)",
};

function getScoreLabel(score: number): string {
  if (score < 40) return "Poor";
  if (score < 60) return "Needs Work";
  if (score < 80) return "Good";
  return "Excellent";
}

/**
 * Circular score indicator (0-100) using Recharts RadialBarChart.
 * Color-coded by score threshold. Shows numeric score in the center.
 */
export interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function ScoreGauge({
  score,
  size = "md",
  showLabel = true,
  animated = true,
  className,
}: ScoreGaugeProps) {
  const safeScore = Number.isFinite(score) ? score : 0;
  const dimension = SIZE_MAP[size];
  const color = getScoreColor(safeScore);
  const fillColor = SCORE_COLORS[color] ?? "var(--chart-1)";

  const data = [
    { name: "score", value: safeScore, fill: fillColor },
  ];

  const fontSize = size === "sm" ? "text-xl" : size === "md" ? "text-3xl" : "text-5xl";
  const labelSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: dimension, height: dimension }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="90%"
          startAngle={90}
          endAngle={-270}
          data={data}
          barSize={size === "sm" ? 8 : size === "md" ? 12 : 16}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={10}
            background={{ fill: "hsl(var(--muted))" }}
            isAnimationActive={animated}
            animationDuration={1000}
            max={100}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold leading-none", fontSize)}>
          {Math.round(safeScore)}
        </span>
        {showLabel && (
          <span className={cn("mt-1 text-muted-foreground", labelSize)}>
            {getScoreLabel(safeScore)}
          </span>
        )}
      </div>
    </div>
  );
}
