import { cn } from "@/lib/utils";

/** Skeleton loading states for cards, tables, charts, and full pages. */
export interface LoadingSkeletonProps {
  variant: "card" | "table" | "chart" | "page";
  className?: string;
  count?: number;
}

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <Bone className="mb-4 h-4 w-1/3" />
      <Bone className="mb-2 h-8 w-1/2" />
      <Bone className="h-3 w-2/3" />
    </div>
  );
}

function TableSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Bone className="h-10 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Bone key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <Bone className="mb-4 h-4 w-1/4" />
      <Bone className="h-48 w-full" />
    </div>
  );
}

function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <Bone className="h-8 w-1/3" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <ChartSkeleton />
      <TableSkeleton />
    </div>
  );
}

const variants = {
  card: CardSkeleton,
  table: TableSkeleton,
  chart: ChartSkeleton,
  page: PageSkeleton,
};

export function LoadingSkeleton({ variant, className, count = 1 }: LoadingSkeletonProps) {
  const Component = variants[variant];
  if (count > 1) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <Component key={i} className={className} />
        ))}
      </div>
    );
  }
  return <Component className={className} />;
}
