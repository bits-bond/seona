"use client";

import { Chip } from "@heroui/react";
import { cn } from "@/lib/utils";
import { SEVERITY_CONFIG } from "@/types/index";

type Severity = "critical" | "high" | "medium" | "low";

/** Maps severity levels to color-coded HeroUI Chips. */
export interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <Chip
      color={config.color}
      variant="soft"
      size="sm"
      className={cn(className)}
    >
      {config.label}
    </Chip>
  );
}
