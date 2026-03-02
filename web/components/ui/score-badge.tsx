"use client";

import { Chip } from "@heroui/react";
import { cn, getScoreColor, formatScore } from "@/lib/utils";

/** Displays a numeric score as a color-coded HeroUI Chip based on threshold. */
export interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const color = getScoreColor(score);

  return (
    <Chip color={color} variant="flat" size="sm" className={cn(className)}>
      {formatScore(score)}
    </Chip>
  );
}
