import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditCategories, audits } from '@/lib/db/schema';
import { eq, avg, sql } from 'drizzle-orm';

// GET /api/audits/categories — average category scores across all completed audits
export async function GET() {
  try {
    const results = await db
      .select({
        category: auditCategories.category,
        score: sql<number>`ROUND(AVG(${auditCategories.score}))::int`,
        weight: sql<number>`ROUND(AVG(${auditCategories.weight}))::int`,
        weightedScore: sql<number>`ROUND(AVG(${auditCategories.weightedScore})::numeric, 1)`,
      })
      .from(auditCategories)
      .innerJoin(audits, eq(auditCategories.auditId, audits.id))
      .where(eq(audits.status, 'completed'))
      .groupBy(auditCategories.category);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to fetch category averages:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
