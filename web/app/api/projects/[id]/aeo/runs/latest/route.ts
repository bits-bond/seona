import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { aeoActionItems, aeoRecommendations, aeoRuns, projects } from '@/lib/db/schema';
import { computeScore } from '@/lib/aeo/score';
import { loadRunByPath, projectToBrandConfig } from '@/lib/aeo/runner-server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const [run] = await db
    .select()
    .from(aeoRuns)
    .where(eq(aeoRuns.projectId, id))
    .orderBy(desc(aeoRuns.createdAt))
    .limit(1);
  if (!run) return NextResponse.json({ run: null });

  const cfg = projectToBrandConfig(project);
  const runData = run.runFilePath ? await loadRunByPath(cfg.domain, run.runFilePath) : null;
  const score = runData ? computeScore(runData) : null;

  const actionItems = await db
    .select()
    .from(aeoActionItems)
    .where(eq(aeoActionItems.runId, run.id))
    .orderBy(aeoActionItems.orderIndex);

  const recommendations = await db
    .select()
    .from(aeoRecommendations)
    .where(eq(aeoRecommendations.runId, run.id));

  return NextResponse.json({
    run: {
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      overallScore: run.overallScore,
      brandCitationRate: run.brandCitationRate,
      bestCompetitorRate: run.bestCompetitorRate,
      gapPoints: run.gapPoints,
      totalCostUsd: run.totalCostUsd,
      totalLatencyMs: run.totalLatencyMs,
      providers: run.providers,
      samplesPerProvider: run.samplesPerProvider,
      dryRun: run.dryRun === 1,
      interpretation: run.interpretation,
      errorMessage: run.errorMessage,
    },
    score,
    actionItems: actionItems.map((a) => ({
      id: a.itemKey,
      title: a.title,
      description: a.description,
      severity: a.severity,
      impactScore: a.impactScore,
      effortScore: a.effortScore,
      source: a.source,
    })),
    recommendations: recommendations.map((r) => ({
      promptId: r.promptHash,
      competitor: r.competitor,
      gapDescription: r.gapDescription,
      recommendations: r.recommendations ?? [],
    })),
  });
}
