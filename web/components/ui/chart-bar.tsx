"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
 * Themed Recharts BarChart wrapper for category score comparisons.
 * Supports grouped and stacked bars with HeroUI-consistent colors.
 */
export interface ChartBarProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  labels?: Record<string, string>;
  height?: number;
  stacked?: boolean;
  layout?: "horizontal" | "vertical";
  className?: string;
}

export function ChartBar({
  data,
  xKey,
  yKeys,
  labels,
  height = 300,
  stacked = false,
  layout = "horizontal",
  className,
}: ChartBarProps) {
  const isVertical = layout === "vertical";

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          {isVertical ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                dataKey={xKey}
                type="category"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                width={100}
              />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            </>
          )}
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {yKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              name={labels?.[key] ?? key}
              stackId={stacked ? "stack" : undefined}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
