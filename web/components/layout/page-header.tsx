import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 pb-6", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-default-900">
          {title}
        </h1>
        {description && (
          <p className="text-default-500 text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
