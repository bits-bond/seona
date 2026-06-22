import { NextRequest, NextResponse } from 'next/server';
import { runSuggestPromptsServer } from '@/lib/aeo/runner-server';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const count = Number(body.count ?? 10);
  try {
    const { prompts, usedFallback } = await runSuggestPromptsServer(id, count);
    return NextResponse.json({ prompts, usedFallback });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
