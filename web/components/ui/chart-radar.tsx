"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const tooltipStyle: CSSProperties = {
  backgroundColor: "#18181b",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "14px",
  color: "#fff",
  border: "none",
};

/**
 * Themed Recharts RadarChart wrapper for multi-category visualization.
 * Ideal for displaying SEO category scores in a spider/radar layout.
 */
export interface ChartRadarProps {
  data: Record<string, unknown>[];
  angleKey: string;
  valueKeys: string[];
  labels?: Record<string, string>;
  height?: number;
  className?: string;
}

export function ChartRadar({
  data,
  angleKey,
  valueKeys,
  labels,
  height = 300,
  className,
}: ChartRadarProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey={angleKey}
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {valueKeys.map((key, i) => (
            <Radar
              key={key}
              name={labels?.[key] ?? key}
              dataKey={key}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              fillOpacity={0.2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
