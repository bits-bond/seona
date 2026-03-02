import { Button } from "@heroui/react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Centered empty state with icon, title, description, and optional CTA button. */
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
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
      {actionLabel && onAction && (
        <Button color="primary" className="mt-6" onPress={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
