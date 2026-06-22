import { NextResponse } from 'next/server';
import { desc, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { aeoRuns, projects } from '@/lib/db/schema';

export async function GET() {
  const rows = await db
    .select()
    .from(projects)
    .where(isNotNull(projects.aeoIndustry))
    .orderBy(desc(projects.updatedAt));

  const enriched = await Promise.all(
    rows.map(async (p) => {
      const [latest] = await db
        .select()
        .from(aeoRuns)
        .where(eq(aeoRuns.projectId, p.id))
        .orderBy(desc(aeoRuns.createdAt))
        .limit(1);
      return {
        projectId: p.id,
        name: p.name,
        url: p.url,
        industry: p.aeoIndustry,
        language: p.aeoLanguage ?? 'de',
        accentColor: p.aeoAccentColor ?? '#e05a33',
        competitorCount: (p.aeoCompetitors ?? []).length,
        latestRun: latest
          ? {
              id: latest.id,
              status: latest.status,
              overallScore: latest.overallScore,
              completedAt: latest.completedAt,
              totalCostUsd: latest.totalCostUsd,
            }
          : null,
      };
    }),
  );

  return NextResponse.json(enriched);
}
