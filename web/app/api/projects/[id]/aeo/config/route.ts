import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { persistConfigToFilesystem } from '@/lib/aeo/runner-server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return NextResponse.json({
    projectId: row.id,
    name: row.name,
    url: row.url,
    industry: row.aeoIndustry ?? 'other',
    description: row.aeoDescription ?? '',
    services: row.aeoServices ?? [],
    targetCustomer: row.aeoTargetCustomer ?? '',
    region: row.aeoRegion ?? 'DACH',
    aliases: row.aeoAliases ?? [],
    competitors: row.aeoCompetitors ?? [],
    accentColor: row.aeoAccentColor ?? '#e05a33',
    logoPath: row.aeoLogoPath ?? null,
    language: row.aeoLanguage ?? 'de',
    hasAeoConfig: !!row.aeoIndustry,
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const competitors = Array.isArray(body.competitors)
    ? body.competitors.map((c: { domain?: string; brandName?: string; aliases?: string[] }) => ({
        domain: String(c.domain ?? ''),
        brandName: String(c.brandName ?? c.domain ?? ''),
        aliases: Array.isArray(c.aliases) ? c.aliases.map(String) : [],
      })).filter((c: { domain: string }) => c.domain.length > 0)
    : [];
  const services = Array.isArray(body.services) ? body.services.map(String).filter(Boolean) : [];
  const aliases = Array.isArray(body.aliases) ? body.aliases.map(String).filter(Boolean) : [];

  const [updated] = await db
    .update(projects)
    .set({
      aeoIndustry: body.industry ?? 'other',
      aeoDescription: body.description ?? '',
      aeoServices: services,
      aeoTargetCustomer: body.targetCustomer ?? '',
      aeoRegion: body.region ?? 'DACH',
      aeoAliases: aliases,
      aeoCompetitors: competitors,
      aeoAccentColor: body.accentColor ?? '#e05a33',
      aeoLogoPath: body.logoPath ?? null,
      aeoLanguage: body.language ?? 'de',
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // mirror to filesystem so CLI can use the same config
  try {
    await persistConfigToFilesystem(updated);
  } catch (err) {
    return NextResponse.json({ error: `Saved DB but filesystem mirror failed: ${(err as Error).message}` }, { status: 207 });
  }

  return NextResponse.json({ ok: true });
}
