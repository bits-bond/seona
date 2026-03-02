"use client";

import { ScoreBadge } from '@/components/ui';
import { CATEGORY_CONFIG } from '@/types';
import { cn } from '@/lib/utils';
import {
  Settings,
  FileText,
  Code,
  Database,
  Zap,
  ImageIcon,
  Bot,
} from 'lucide-react';
import type { AuditCategory, CategoryType } from '@/types';

interface CategoryCardsProps {
  categories: AuditCategory[];
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  Settings: <Settings className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  Code: <Code className="h-5 w-5" />,
  Database: <Database className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  Image: <ImageIcon className="h-5 w-5" />,
  Bot: <Bot className="h-5 w-5" />,
};

export function CategoryCards({ categories, className }: CategoryCardsProps) {
  const categoryTypes = Object.keys(CATEGORY_CONFIG) as CategoryType[];

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4', className)}>
      {categoryTypes.map((catType) => {
        const config = CATEGORY_CONFIG[catType];
        const catData = categories.find((c) => c.category === catType);
        const score = catData?.score ?? 0;
        const weight = catData?.weight ?? config.weight;

        return (
          <div
            key={catType}
            className="p-4 rounded-xl bg-content1 border border-divider hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `color-mix(in oklch, ${config.color} 15%, transparent)` }}
                >
                  <span style={{ color: config.color }}>
                    {iconMap[config.icon]}
                  </span>
                </div>
                <span className="text-sm font-medium">{config.label}</span>
              </div>
              <ScoreBadge score={score} />
            </div>
            <div className="flex items-center justify-between text-xs text-default-500">
              <span>Weight: {weight}%</span>
              <span>Weighted: {((score * weight) / 100).toFixed(1)}</span>
            </div>
            <div className="mt-2 w-full h-1.5 rounded-full bg-default-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${score}%`,
                  backgroundColor: config.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
