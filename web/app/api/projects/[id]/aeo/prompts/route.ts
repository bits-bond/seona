import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { aeoPrompts } from '@/lib/db/schema';
import { setApprovedPrompts } from '@/lib/aeo/runner-server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(aeoPrompts)
    .where(eq(aeoPrompts.projectId, id))
    .orderBy(aeoPrompts.orderIndex);
  return NextResponse.json(
    rows.map((r) => ({
      id: r.promptHash,
      text: r.text,
      orderIndex: r.orderIndex,
      isApproved: r.isApproved === 1,
    })),
  );
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  if (!Array.isArray(body.prompts)) {
    return NextResponse.json({ error: 'prompts array required' }, { status: 400 });
  }
  const prompts = body.prompts
    .map((p: { id?: string; text?: string }) => ({ id: String(p.id ?? ''), text: String(p.text ?? '') }))
    .filter((p: { text: string }) => p.text.trim().length > 0);
  try {
    await setApprovedPrompts(id, prompts);
    return NextResponse.json({ ok: true, count: prompts.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
