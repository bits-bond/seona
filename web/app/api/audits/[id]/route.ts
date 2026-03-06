import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { audits, auditCategories, auditIssues } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/audits/[id] — single audit with categories and issues
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid audit ID' }, { status: 400 });
    }

    const audit = await db.query.audits.findFirst({
      where: eq(audits.id, id),
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    const categories = await db
      .select()
      .from(auditCategories)
      .where(eq(auditCategories.auditId, id));

    const issues = await db
      .select()
      .from(auditIssues)
      .where(eq(auditIssues.auditId, id))
      .orderBy(auditIssues.orderIndex);

    return NextResponse.json({
      ...audit,
      categories,
      issues,
    });
  } catch (error) {
    console.error('Failed to fetch audit:', error);
    return NextResponse.json({ error: 'Failed to fetch audit' }, { status: 500 });
  }
}

// PUT /api/audits/[id] — update audit status, score, report, etc.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.overallScore !== undefined) updateData.overallScore = body.overallScore;
    if (body.businessType !== undefined) updateData.businessType = body.businessType;
    if (body.pagesCrawled !== undefined) updateData.pagesCrawled = body.pagesCrawled;
    if (body.startedAt !== undefined) updateData.startedAt = new Date(body.startedAt);
    if (body.completedAt !== undefined) updateData.completedAt = new Date(body.completedAt);
    if (body.fullReportMd !== undefined) updateData.fullReportMd = body.fullReportMd;
    if (body.actionPlanMd !== undefined) updateData.actionPlanMd = body.actionPlanMd;
    if (body.errorMessage !== undefined) updateData.errorMessage = body.errorMessage;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const [updated] = await db
      .update(audits)
      .set(updateData)
      .where(eq(audits.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update audit:', error);
    return NextResponse.json({ error: 'Failed to update audit' }, { status: 500 });
  }
}

// DELETE /api/audits/[id] — delete audit (cascades to categories and issues)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(audits)
      .where(eq(audits.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Audit deleted' });
  } catch (error) {
    console.error('Failed to delete audit:', error);
    return NextResponse.json({ error: 'Failed to delete audit' }, { status: 500 });
  }
}
