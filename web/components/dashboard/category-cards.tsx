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
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
      {categoryTypes.map((catType) => {
        const config = CATEGORY_CONFIG[catType];
        const catData = categories.find((c) => c.category === catType);
        const score = catData?.score ?? 0;
        const weight = catData?.weight ?? config.weight;

        return (
          <div
            key={catType}
            className="p-3 rounded-xl bg-content1 border border-divider hover:border-primary/30 transition-colors overflow-hidden"
          >
            <div className="flex items-start gap-2 mb-2">
              <div
                className="p-1.5 rounded-lg shrink-0"
                style={{ backgroundColor: `color-mix(in oklch, ${config.color} 15%, transparent)` }}
              >
                <span style={{ color: config.color }}>
                  {iconMap[config.icon]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium truncate">{config.label}</span>
                  <ScoreBadge score={score} />
                </div>
                <div className="flex items-center gap-3 text-[11px] text-default-400 mt-1">
                  <span>W: {weight}%</span>
                  <span>{((score * weight) / 100).toFixed(1)}pts</span>
                </div>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-default-200 overflow-hidden">
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
