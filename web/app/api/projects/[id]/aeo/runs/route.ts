import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { aeoRuns } from '@/lib/db/schema';
import { startRun, isRunning } from '@/lib/aeo/runner-server';
import type { ProviderId } from '@/lib/aeo/types';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(aeoRuns)
    .where(eq(aeoRuns.projectId, id))
    .orderBy(desc(aeoRuns.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (isRunning(id)) {
    return NextResponse.json({ error: 'A run is already in progress' }, { status: 409 });
  }
  try {
    const result = await startRun({
      projectId: id,
      samples: body.samples ? Number(body.samples) : undefined,
      maxSpendUsd: body.maxSpendUsd ? Number(body.maxSpendUsd) : undefined,
      enabled: Array.isArray(body.providers) ? (body.providers as ProviderId[]) : undefined,
      forceDryRun: !!body.dryRun,
      runSuggest: body.runSuggest !== false,
      generateArtifacts: body.generateArtifacts !== false,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
