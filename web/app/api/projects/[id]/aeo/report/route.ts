import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { aeoRuns, projects } from '@/lib/db/schema';
import { artifactsDir } from '@/lib/aeo/storage';
import { computeScore } from '@/lib/aeo/score';
import { loadRunByPath, projectToBrandConfig } from '@/lib/aeo/runner-server';
import { generateEeatRecommendations } from '@/lib/aeo/artifacts/eeat-recommendations';
import { prioritize } from '@/lib/aeo/prioritizer';
import { buildAeoReportHtml, renderAeoPdf } from '@/lib/pdf/template-aeo';
import type { SuggestRecommendation } from '@/lib/aeo/types';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const sp = req.nextUrl.searchParams;
  const lang = (sp.get('lang') ?? 'de') as 'de' | 'en';
  const format = sp.get('format') ?? 'html';

  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const [latest] = await db
    .select()
    .from(aeoRuns)
    .where(eq(aeoRuns.projectId, id))
    .orderBy(desc(aeoRuns.createdAt))
    .limit(1);
  if (!latest || !latest.runFilePath) {
    return NextResponse.json({ error: 'no completed run to render' }, { status: 404 });
  }
  const cfg = projectToBrandConfig(project);
  const run = await loadRunByPath(cfg.domain, latest.runFilePath);
  if (!run) return NextResponse.json({ error: 'run file missing' }, { status: 404 });
  const score = computeScore(run);

  // Artifact previews from filesystem
  const dir = artifactsDir(cfg.domain);
  const safeRead = async (name: string) => {
    try {
      return await fs.readFile(join(dir, name), 'utf8');
    } catch {
      return '';
    }
  };
  const llmsTxt = await safeRead('llms.txt');
  const robotsDiff = await safeRead('robots-patch.diff');
  const schemaJsonLd = await safeRead('schema.jsonld');
  const indexJsonRaw = await safeRead('index.json');
  const robotsChanges: string[] = (() => {
    try {
      const parsed = JSON.parse(indexJsonRaw || '{}');
      return Array.isArray(parsed.robotsChanges) ? parsed.robotsChanges : [];
    } catch {
      return [];
    }
  })();
  const recsRaw = await (async () => {
    try {
      return JSON.parse(await fs.readFile(join(dir, '..', 'recommendations.json'), 'utf8'));
    } catch {
      return [] as SuggestRecommendation[];
    }
  })();
  const recommendations: SuggestRecommendation[] = Array.isArray(recsRaw) ? recsRaw : [];

  const eeat = generateEeatRecommendations(cfg);
  const actionItems = prioritize({
    config: cfg,
    score,
    recommendations,
    eeat,
    llmsTxtMissing: llmsTxt.length === 0,
    robotsPatchChanges: robotsChanges,
  });

  const html = buildAeoReportHtml({
    run,
    score,
    config: cfg,
    actionItems,
    competitorGaps: recommendations,
    eeat,
    artifacts: {
      llmsTxt: llmsTxt || '(noch nicht generiert)',
      robotsPatch: { diff: robotsDiff, changes: robotsChanges },
      schemaJsonLdCombined: schemaJsonLd,
    },
    language: lang,
  });

  if (format === 'pdf') {
    try {
      const buf = await renderAeoPdf({
        run,
        score,
        config: cfg,
        actionItems,
        competitorGaps: recommendations,
        eeat,
        artifacts: {
          llmsTxt: llmsTxt || '(noch nicht generiert)',
          robotsPatch: { diff: robotsDiff, changes: robotsChanges },
          schemaJsonLdCombined: schemaJsonLd,
        },
        language: lang,
      }, html);
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `SEONA_AEO_${cfg.domain}_${dateStr}_${lang}.pdf`;
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (err) {
      return NextResponse.json({ error: `PDF render failed: ${(err as Error).message}` }, { status: 500 });
    }
  }

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
