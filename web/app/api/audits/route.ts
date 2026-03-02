import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { audits } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/audits — list audits, optionally filtered by projectId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let query = db
      .select()
      .from(audits)
      .orderBy(desc(audits.createdAt));

    if (projectId) {
      query = query.where(eq(audits.projectId, projectId)) as typeof query;
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch audits:', error);
    return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 });
  }
}

// POST /api/audits — create a new audit with status 'pending'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const [audit] = await db
      .insert(audits)
      .values({
        projectId: body.projectId,
        status: 'pending',
      })
      .returning();

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    console.error('Failed to create audit:', error);
    return NextResponse.json({ error: 'Failed to create audit' }, { status: 500 });
  }
}
