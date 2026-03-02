import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={item.label} className="flex items-center gap-1">
            {index > 0 && (
              <span className="text-default-400 select-none">/</span>
            )}
            {isLast || !item.href ? (
              <span
                className={cn(
                  "text-default-700",
                  isLast && "font-semibold"
                )}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-default-500 hover:text-default-700 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
