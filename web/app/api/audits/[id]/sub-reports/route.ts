import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditSubReports } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/audits/[id]/sub-reports — fetch all sub-reports for an audit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid audit ID' }, { status: 400 });
    }

    const subReports = await db
      .select()
      .from(auditSubReports)
      .where(eq(auditSubReports.auditId, id));

    return NextResponse.json({ subReports });
  } catch (error) {
    console.error('Failed to fetch sub-reports:', error);
    return NextResponse.json({ error: 'Failed to fetch sub-reports' }, { status: 500 });
  }
}

// POST /api/audits/[id]/sub-reports — bulk insert sub-reports (idempotent: deletes existing first)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid audit ID' }, { status: 400 });
    }

    const body = await request.json();
    const { subReports } = body;

    if (!Array.isArray(subReports) || subReports.length === 0) {
      return NextResponse.json({ error: 'subReports array required' }, { status: 400 });
    }

    // Delete existing sub-reports for this audit (idempotent upsert)
    await db.delete(auditSubReports).where(eq(auditSubReports.auditId, id));

    // Insert new sub-reports
    const rows = subReports.map((r: { slug: string; title: string; content: string; source?: string }) => ({
      auditId: id,
      slug: r.slug,
      title: r.title,
      content: r.content,
      source: r.source ?? 'file',
    }));

    await db.insert(auditSubReports).values(rows);

    return NextResponse.json({ inserted: rows.length });
  } catch (error) {
    console.error('Failed to save sub-reports:', error);
    return NextResponse.json({ error: 'Failed to save sub-reports' }, { status: 500 });
  }
}
