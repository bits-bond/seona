import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditIssues } from '@/lib/db/schema';

// POST /api/audits/[id]/issues — bulk insert issues for an audit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auditId } = await params;
    const body = await request.json();

    if (!Array.isArray(body.issues) || body.issues.length === 0) {
      return NextResponse.json({ error: 'issues array is required' }, { status: 400 });
    }

    const rows = body.issues.map((issue: { category: string | null; severity: string; title: string; description: string; impact: string | null; orderIndex: number }) => ({
      auditId,
      category: issue.category ?? 'technical',
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      impact: issue.impact,
      orderIndex: issue.orderIndex,
    }));

    await db.insert(auditIssues).values(rows);

    return NextResponse.json({ inserted: rows.length }, { status: 201 });
  } catch (error) {
    console.error('Failed to insert audit issues:', error);
    return NextResponse.json({ error: 'Failed to insert issues' }, { status: 500 });
  }
}
