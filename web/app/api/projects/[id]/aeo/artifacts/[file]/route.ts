import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { artifactsDir } from '@/lib/aeo/storage';
import { projectToBrandConfig } from '@/lib/aeo/runner-server';

type Params = { params: Promise<{ id: string; file: string }> };

const ALLOWED = new Set([
  'llms.txt',
  'robots-patch.diff',
  'robots-proposed.txt',
  'schema.jsonld',
  'eeat-recommendations.md',
  'index.json',
]);

const MIME: Record<string, string> = {
  'llms.txt': 'text/plain; charset=utf-8',
  'robots-patch.diff': 'text/plain; charset=utf-8',
  'robots-proposed.txt': 'text/plain; charset=utf-8',
  'schema.jsonld': 'application/ld+json; charset=utf-8',
  'eeat-recommendations.md': 'text/markdown; charset=utf-8',
  'index.json': 'application/json; charset=utf-8',
};

export async function GET(req: NextRequest, { params }: Params) {
  const { id, file } = await params;
  if (!ALLOWED.has(file)) return NextResponse.json({ error: 'unknown artifact' }, { status: 404 });
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  const cfg = projectToBrandConfig(project);
  const path = join(artifactsDir(cfg.domain), file);
  try {
    const content = await fs.readFile(path, 'utf8');
    const download = req.nextUrl.searchParams.get('download') === '1';
    return new NextResponse(content, {
      headers: {
        'Content-Type': MIME[file] ?? 'text/plain; charset=utf-8',
        ...(download ? { 'Content-Disposition': `attachment; filename="${file}"` } : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: 'artifact not yet generated' }, { status: 404 });
  }
}
