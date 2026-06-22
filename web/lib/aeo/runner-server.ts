import { promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { aeoActionItems, aeoPrompts, aeoRecommendations, aeoRuns, projects } from '@/lib/db/schema';
import { buildProviders } from './providers/index';
import { suggestPrompts } from './prompt-suggest';
import { runQuery, type ProgressEvent } from './query-runner';
import { computeScore } from './score';
import { suggestRecommendations } from './competitor-suggest';
import { generateLlmsTxt } from './artifacts/llms-txt';
import { generateRobotsPatch } from './artifacts/robots-patch';
import { generateSchemaJsonLd } from './artifacts/schema-jsonld';
import { generateEeatRecommendations } from './artifacts/eeat-recommendations';
import { prioritize } from './prioritizer';
import { scrapePage } from './scraper';
import {
  aeoDir,
  artifactsDir,
  loadConfig,
  saveConfig,
  savePrompts,
  saveRun,
  writeJson,
  writeText,
} from './storage';
import type {
  ActionItem,
  BrandConfig,
  Industry,
  Prompt,
  ProviderId,
  Run,
  SuggestRecommendation,
} from './types';
import { BrandConfigSchema } from './types';

export interface RunnerProgress {
  status: 'idle' | 'pending' | 'preparing' | 'tracking' | 'suggesting' | 'artifacts' | 'rendering' | 'completed' | 'failed';
  stage: string;
  percentage: number;
  message?: string;
  totalCostUsd?: number;
  callsDone?: number;
  callsTotal?: number;
  runId?: string;
  errorMessage?: string;
  updatedAt: string;
}

const globalForAeo = globalThis as typeof globalThis & {
  __aeoProgressMap?: Map<string, RunnerProgress>;
  __aeoRunningSet?: Set<string>;
};

const progressMap = (globalForAeo.__aeoProgressMap ??= new Map<string, RunnerProgress>());
const runningSet = (globalForAeo.__aeoRunningSet ??= new Set<string>());

// Explicit fixture path so Next.js Webpack bundling doesn't break __dirname resolution
const FIXTURE_DIR = resolve(process.cwd(), 'lib', 'aeo', 'fixtures');

function setProgress(projectId: string, patch: Partial<RunnerProgress>): void {
  const prev = progressMap.get(projectId);
  const next: RunnerProgress = {
    status: patch.status ?? prev?.status ?? 'pending',
    stage: patch.stage ?? prev?.stage ?? '',
    percentage: patch.percentage ?? prev?.percentage ?? 0,
    message: patch.message ?? prev?.message,
    totalCostUsd: patch.totalCostUsd ?? prev?.totalCostUsd,
    callsDone: patch.callsDone ?? prev?.callsDone,
    callsTotal: patch.callsTotal ?? prev?.callsTotal,
    runId: patch.runId ?? prev?.runId,
    errorMessage: patch.errorMessage ?? prev?.errorMessage,
    updatedAt: new Date().toISOString(),
  };
  progressMap.set(projectId, next);
}

export function getRunnerProgress(projectId: string): RunnerProgress | null {
  return progressMap.get(projectId) ?? null;
}

export function isRunning(projectId: string): boolean {
  return runningSet.has(projectId);
}

export function clearProgress(projectId: string): void {
  progressMap.delete(projectId);
}

export interface ApiKeyStatus {
  openai: boolean;
  anthropic: boolean;
  gemini: boolean;
}

export function checkApiKeys(): ApiKeyStatus {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    gemini: !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY),
  };
}

export function projectToBrandConfig(project: typeof projects.$inferSelect): BrandConfig {
  const domain = inferDomain(project.url);
  return BrandConfigSchema.parse({
    domain,
    brandName: project.name,
    aliases: project.aeoAliases ?? [],
    language: project.aeoLanguage ?? 'de',
    logoPath: project.aeoLogoPath,
    accentColor: project.aeoAccentColor ?? '#e05a33',
    industry: (project.aeoIndustry as Industry) ?? 'other',
    description: project.aeoDescription ?? '',
    services: project.aeoServices ?? [],
    targetCustomer: project.aeoTargetCustomer ?? '',
    region: project.aeoRegion ?? 'DACH',
    competitors: project.aeoCompetitors ?? [],
  });
}

export function inferDomain(url: string): string {
  try {
    if (!url.startsWith('http')) url = `https://${url}`;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

export async function persistConfigToFilesystem(project: typeof projects.$inferSelect): Promise<BrandConfig> {
  const cfg = projectToBrandConfig(project);
  await saveConfig(cfg.domain, cfg);
  return cfg;
}

export async function runSuggestPromptsServer(
  projectId: string,
  count = 10,
): Promise<{ prompts: Prompt[]; usedFallback: boolean }> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error('Project not found');
  const cfg = await persistConfigToFilesystem(project);
  const keys = checkApiKeys();
  const dryRun = !keys.openai && !keys.anthropic && !keys.gemini;
  const { providers } = await buildProviders({ dryRun, enabled: ['openai'], fixtureDir: FIXTURE_DIR });
  const provider = providers[0] ?? null;
  const prompts = await suggestPrompts(cfg, provider, count);
  await savePrompts(cfg.domain, prompts);
  await db.delete(aeoPrompts).where(eq(aeoPrompts.projectId, projectId));
  if (prompts.length > 0) {
    await db.insert(aeoPrompts).values(
      prompts.map((p, i) => ({
        projectId,
        promptHash: p.id,
        text: p.text,
        orderIndex: i,
        isApproved: 0,
      })),
    );
  }
  return { prompts, usedFallback: !provider };
}

export async function setApprovedPrompts(projectId: string, prompts: Prompt[]): Promise<void> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error('Project not found');
  const cfg = await persistConfigToFilesystem(project);
  await savePrompts(cfg.domain, prompts);
  await db.delete(aeoPrompts).where(eq(aeoPrompts.projectId, projectId));
  if (prompts.length > 0) {
    await db.insert(aeoPrompts).values(
      prompts.map((p, i) => ({
        projectId,
        promptHash: p.id,
        text: p.text,
        orderIndex: i,
        isApproved: 1,
      })),
    );
  }
}

export interface StartRunOptions {
  projectId: string;
  samples?: number;
  maxSpendUsd?: number;
  enabled?: ProviderId[];
  forceDryRun?: boolean;
  generateArtifacts?: boolean;
  runSuggest?: boolean;
}

export async function startRun(opts: StartRunOptions): Promise<{ runId: string }> {
  if (runningSet.has(opts.projectId)) {
    throw new Error('A run is already in progress for this project');
  }
  const [project] = await db.select().from(projects).where(eq(projects.id, opts.projectId)).limit(1);
  if (!project) throw new Error('Project not found');
  const cfg = await persistConfigToFilesystem(project);

  const savedPrompts = await db
    .select()
    .from(aeoPrompts)
    .where(eq(aeoPrompts.projectId, opts.projectId))
    .orderBy(aeoPrompts.orderIndex);
  if (savedPrompts.length === 0) {
    throw new Error('No prompts approved. Run suggest-prompts and approve them first.');
  }
  const prompts: Prompt[] = savedPrompts.map((p) => ({ id: p.promptHash, text: p.text }));

  const keys = checkApiKeys();
  const dryRun = opts.forceDryRun || (!keys.openai && !keys.anthropic && !keys.gemini);
  const enabled =
    opts.enabled ??
    (['openai', 'anthropic', 'gemini'] as ProviderId[]).filter((id) => dryRun || keys[id]);
  if (enabled.length === 0) throw new Error('No usable providers (no API keys and dry-run not enabled).');

  const [runRow] = await db
    .insert(aeoRuns)
    .values({
      projectId: opts.projectId,
      status: 'pending',
      providers: enabled,
      samplesPerProvider: opts.samples ?? 3,
      dryRun: dryRun ? 1 : 0,
    })
    .returning();

  runningSet.add(opts.projectId);
  setProgress(opts.projectId, {
    status: 'preparing',
    stage: 'Vorbereiten',
    percentage: 2,
    runId: runRow.id,
  });

  // Fire-and-forget. Background async work.
  void executeRun({
    projectId: opts.projectId,
    dbRunId: runRow.id,
    cfg,
    prompts,
    enabled,
    samples: opts.samples ?? 3,
    maxSpendUsd: opts.maxSpendUsd ?? 20,
    dryRun,
    runSuggest: opts.runSuggest ?? true,
    generateArtifacts: opts.generateArtifacts ?? true,
  }).catch(async (err: unknown) => {
    const message = (err as Error).message ?? String(err);
    setProgress(opts.projectId, {
      status: 'failed',
      stage: 'Fehlgeschlagen',
      percentage: 100,
      errorMessage: message,
    });
    await db
      .update(aeoRuns)
      .set({ status: 'failed', errorMessage: message, completedAt: new Date() })
      .where(eq(aeoRuns.id, runRow.id));
    runningSet.delete(opts.projectId);
  });

  return { runId: runRow.id };
}

interface ExecuteRunArgs {
  projectId: string;
  dbRunId: string;
  cfg: BrandConfig;
  prompts: Prompt[];
  enabled: ProviderId[];
  samples: number;
  maxSpendUsd: number;
  dryRun: boolean;
  runSuggest: boolean;
  generateArtifacts: boolean;
}

async function executeRun(args: ExecuteRunArgs): Promise<void> {
  const { projectId, dbRunId, cfg, prompts, enabled, samples, maxSpendUsd, dryRun } = args;
  try {
    await db
      .update(aeoRuns)
      .set({ status: 'running', startedAt: new Date() })
      .where(eq(aeoRuns.id, dbRunId));

    setProgress(projectId, { status: 'preparing', stage: 'Provider initialisieren', percentage: 5 });
    const { providers } = await buildProviders({ dryRun, enabled, fixtureDir: FIXTURE_DIR });
    if (providers.length === 0) throw new Error('No providers available');

    const callsTotal = prompts.length * providers.length * samples;
    let callsDone = 0;
    setProgress(projectId, {
      status: 'tracking',
      stage: 'Tracking-Anfragen laufen',
      percentage: 10,
      callsTotal,
      callsDone: 0,
    });

    const run = await runQuery({
      config: cfg,
      prompts,
      providers,
      samples,
      maxSpendUsd,
      dryRun,
      onProgress: (e: ProgressEvent) => {
        if (e.kind === 'call_done' || e.kind === 'call_failed') {
          callsDone += 1;
          const pct = Math.min(60, 10 + Math.floor((callsDone / callsTotal) * 50));
          setProgress(projectId, {
            stage: 'Tracking-Anfragen laufen',
            percentage: pct,
            callsDone,
            callsTotal,
            totalCostUsd: e.kind === 'call_done' ? e.totalUsd : undefined,
          });
        }
      },
    });
    await saveRun(cfg.domain, run);

    setProgress(projectId, { status: 'suggesting', stage: 'Score & Wettbewerber-Analyse', percentage: 65 });
    const score = computeScore(run);

    let recs: SuggestRecommendation[] = [];
    if (args.runSuggest && !dryRun && providers.length > 0) {
      try {
        recs = await suggestRecommendations({
          config: cfg,
          score,
          provider: providers.find((p) => p.id === 'anthropic') ?? providers[0],
        });
      } catch {
        recs = [];
      }
    }
    await writeJson(join(aeoDir(cfg.domain), 'recommendations.json'), recs);
    await db.delete(aeoRecommendations).where(eq(aeoRecommendations.runId, dbRunId));
    if (recs.length > 0) {
      await db.insert(aeoRecommendations).values(
        recs.map((r) => ({
          projectId,
          runId: dbRunId,
          promptHash: r.promptId,
          competitor: r.competitor,
          gapDescription: r.gapDescription,
          recommendations: r.recommendations,
        })),
      );
    }

    setProgress(projectId, { status: 'artifacts', stage: 'Artefakte generieren', percentage: 78 });
    let homepage = null;
    if (!dryRun) {
      try {
        homepage = await scrapePage(`https://${cfg.domain}`, { respectRobots: true });
      } catch {
        homepage = null;
      }
    }
    const llms = generateLlmsTxt({ config: cfg, homepage });
    await writeText(join(artifactsDir(cfg.domain), 'llms.txt'), llms);

    let existingRobots = '';
    if (!dryRun) {
      try {
        const resp = await fetch(`https://${cfg.domain}/robots.txt`);
        if (resp.ok) existingRobots = await resp.text();
      } catch {}
    }
    const robots = generateRobotsPatch({ existing: existingRobots });
    await writeText(join(artifactsDir(cfg.domain), 'robots-patch.diff'), robots.diff);
    await writeText(join(artifactsDir(cfg.domain), 'robots-proposed.txt'), robots.fullProposed);

    const schema = generateSchemaJsonLd({ config: cfg, description: homepage?.description ?? undefined });
    await writeText(join(artifactsDir(cfg.domain), 'schema.jsonld'), schema.combined);

    const eeat = generateEeatRecommendations(cfg);
    const eeatMd = eeat
      .map((r) => `### ${r.area}\n\n${r.recommendation}\n\n_Impact: ${r.impact} · Aufwand: ${r.effort}_`)
      .join('\n\n');
    await writeText(
      join(artifactsDir(cfg.domain), 'eeat-recommendations.md'),
      `# E-E-A-T-Empfehlungen für ${cfg.brandName}\n\n${eeatMd}\n`,
    );
    await writeJson(join(artifactsDir(cfg.domain), 'index.json'), {
      llmsTxt: 'llms.txt',
      robotsPatch: 'robots-patch.diff',
      robotsProposed: 'robots-proposed.txt',
      robotsChanges: robots.changes,
      schemaJsonLd: 'schema.jsonld',
      eeat: 'eeat-recommendations.md',
    });

    setProgress(projectId, { status: 'rendering', stage: 'Maßnahmenplan erstellen', percentage: 90 });
    const actionItems: ActionItem[] = prioritize({
      config: cfg,
      score,
      recommendations: recs,
      eeat,
      llmsTxtMissing: false,
      robotsPatchChanges: robots.changes,
    });
    await db.delete(aeoActionItems).where(eq(aeoActionItems.runId, dbRunId));
    if (actionItems.length > 0) {
      await db.insert(aeoActionItems).values(
        actionItems.map((a, i) => ({
          projectId,
          runId: dbRunId,
          itemKey: a.id,
          title: a.title,
          description: a.description,
          severity: a.severity,
          impactScore: a.impactScore,
          effortScore: a.effortScore,
          source: a.source,
          orderIndex: i,
        })),
      );
    }

    const runFilePath = `runs/${run.timestamp.replace(/[:.]/g, '-')}.json`;
    await db
      .update(aeoRuns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        overallScore: score.overall,
        brandCitationRate: score.brandCitationRate,
        bestCompetitorRate: score.bestCompetitorRate,
        gapPoints: score.gapPoints,
        totalCostUsd: run.totalCostUsd,
        totalLatencyMs: run.totalLatencyMs,
        runFilePath,
        interpretation: score.interpretation,
      })
      .where(eq(aeoRuns.id, dbRunId));

    setProgress(projectId, {
      status: 'completed',
      stage: 'Abgeschlossen',
      percentage: 100,
      totalCostUsd: run.totalCostUsd,
      callsDone: run.calls.length,
      callsTotal,
    });
  } finally {
    runningSet.delete(args.projectId);
  }
}

export interface RunDetail {
  run: Run | null;
  score: ReturnType<typeof computeScore> | null;
}

export async function loadRunByPath(domain: string, runFilePath: string): Promise<Run | null> {
  try {
    const raw = await fs.readFile(join(aeoDir(domain), runFilePath), 'utf8');
    return JSON.parse(raw) as Run;
  } catch {
    return null;
  }
}

export async function loadLatestRunFor(project: typeof projects.$inferSelect): Promise<Run | null> {
  const cfg = projectToBrandConfig(project);
  const latestPath = join(aeoDir(cfg.domain), 'latest.json');
  try {
    const raw = await fs.readFile(latestPath, 'utf8');
    return JSON.parse(raw) as Run;
  } catch {
    return null;
  }
}

export { loadConfig };
