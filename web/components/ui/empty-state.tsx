"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Centered empty state with icon, title, description, and optional CTA button. */
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground [&>svg]:size-12">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button variant="primary" className="mt-6">
            {actionLabel}
          </Button>
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button variant="primary" className="mt-6" onPress={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
