"use client";

import { ChartRadar } from '@/components/ui';
import { CATEGORY_CONFIG } from '@/types';
import type { AuditCategory, CategoryType } from '@/types';

interface CategoryAveragesProps {
  categories: AuditCategory[];
}

export function CategoryAverages({ categories }: CategoryAveragesProps) {
  const categoryTypes = Object.keys(CATEGORY_CONFIG) as CategoryType[];

  const data = categoryTypes.map((cat) => {
    const catEntries = categories.filter((c) => c.category === cat);
    const avgScore =
      catEntries.length > 0
        ? Math.round(catEntries.reduce((sum, c) => sum + c.score, 0) / catEntries.length)
        : 0;

    return {
      category: CATEGORY_CONFIG[cat].label,
      score: avgScore,
      fullMark: 100,
    };
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Category Averages</h3>
      <ChartRadar
        data={data}
        angleKey="category"
        valueKeys={["score"]}
        height={300}
      />
    </div>
  );
}
