import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditCategories } from '@/lib/db/schema';

// POST /api/audits/[id]/categories — bulk insert categories for an audit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auditId } = await params;
    const body = await request.json();

    if (!Array.isArray(body.categories) || body.categories.length === 0) {
      return NextResponse.json({ error: 'categories array is required' }, { status: 400 });
    }

    const rows = body.categories.map((cat: { category: string; score: number; weight: number; weightedScore: number }) => ({
      auditId,
      category: cat.category,
      score: cat.score,
      weight: cat.weight,
      weightedScore: cat.weightedScore,
    }));

    await db.insert(auditCategories).values(rows);

    return NextResponse.json({ inserted: rows.length }, { status: 201 });
  } catch (error) {
    console.error('Failed to insert audit categories:', error);
    return NextResponse.json({ error: 'Failed to insert categories' }, { status: 500 });
  }
}
