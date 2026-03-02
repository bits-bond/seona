"use client";

import {
  AreaChart,
  Area,
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
 * Themed Recharts AreaChart wrapper with HeroUI-consistent colors,
 * responsive container, and dark tooltip styling.
 */
export interface ChartAreaProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  labels?: Record<string, string>;
  height?: number;
  stacked?: boolean;
  className?: string;
}

export function ChartArea({
  data,
  xKey,
  yKeys,
  labels,
  height = 300,
  stacked = false,
  className,
}: ChartAreaProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {yKeys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={labels?.[key] ?? key}
              stackId={stacked ? "stack" : undefined}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              fillOpacity={0.2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
