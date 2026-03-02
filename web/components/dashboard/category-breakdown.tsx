"use client";

import { useState } from 'react';
import { CATEGORY_CONFIG } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AuditCategory, CategoryType } from '@/types';

interface CategoryBreakdownProps {
  categories: AuditCategory[];
  className?: string;
}

export function CategoryBreakdown({ categories, className }: CategoryBreakdownProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const categoryTypes = Object.keys(CATEGORY_CONFIG) as CategoryType[];

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
      {categoryTypes.map((catType) => {
        const config = CATEGORY_CONFIG[catType];
        const catData = categories.find((c) => c.category === catType);
        const isExpanded = expandedCategories.has(catType);
        const findings = catData?.findingsJson;

        return (
          <div
            key={catType}
            className="rounded-xl border border-divider overflow-hidden"
          >
            <button
              onClick={() => toggleCategory(catType)}
              className="w-full flex items-center justify-between p-4 bg-content1 hover:bg-content2 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{config.label}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    color: config.color,
                    backgroundColor: `color-mix(in oklch, ${config.color} 15%, transparent)`,
                  }}
                >
                  {catData?.score ?? 0}/100
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-default-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-default-500" />
              )}
            </button>
            {isExpanded && (
              <div className="p-4 bg-content2/50 border-t border-divider">
                {findings && Object.keys(findings).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(findings).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium text-default-700">{key}: </span>
                        <span className="text-default-500">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-default-400">
                    No detailed findings available for this category.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
