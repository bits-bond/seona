import pLimit from 'p-limit';
import { hashCallId } from './hash';
import { parseCitations } from './citation-parser';
import type {
  BrandConfig,
  Call,
  LLMProvider,
  Prompt,
  ProviderId,
  Run,
} from './types';
import { CostTracker } from './cost-tracker';

export interface RunOptions {
  config: BrandConfig;
  prompts: Prompt[];
  providers: LLMProvider[];
  samples: number;
  maxSpendUsd: number;
  concurrency?: number;
  dryRun?: boolean;
  onProgress?: (event: ProgressEvent) => void;
}

export type ProgressEvent =
  | { kind: 'call_start'; promptId: string; provider: ProviderId; sampleIndex: number }
  | { kind: 'call_done'; promptId: string; provider: ProviderId; sampleIndex: number; costUsd: number; totalUsd: number }
  | { kind: 'call_failed'; promptId: string; provider: ProviderId; sampleIndex: number; error: string }
  | { kind: 'budget_exceeded'; totalUsd: number; cap: number };

export async function runQuery(opts: RunOptions): Promise<Run> {
  const tracker = new CostTracker(opts.maxSpendUsd);
  const limit = pLimit(opts.concurrency ?? 4);
  const calls: Call[] = [];
  const ts = new Date().toISOString();
  const tasks: Promise<void>[] = [];

  outer: for (const prompt of opts.prompts) {
    for (const provider of opts.providers) {
      for (let i = 0; i < opts.samples; i += 1) {
        if (tracker.exceeded()) {
          opts.onProgress?.({ kind: 'budget_exceeded', totalUsd: tracker.totalUsd, cap: tracker.capUsd });
          break outer;
        }
        const sampleIndex = i;
        tasks.push(
          limit(async () => {
            if (tracker.exceeded()) return;
            opts.onProgress?.({
              kind: 'call_start',
              promptId: prompt.id,
              provider: provider.id,
              sampleIndex,
            });
            try {
              const response = await provider.query(prompt.text);
              const brandCites = parseCitations(response, {
                domain: opts.config.domain,
                brandName: opts.config.brandName,
                aliases: opts.config.aliases,
              });
              const compCites: Record<string, Awaited<ReturnType<typeof parseCitations>>> = {};
              for (const comp of opts.config.competitors) {
                compCites[comp.brandName] = parseCitations(response, {
                  domain: comp.domain,
                  brandName: comp.brandName,
                  aliases: comp.aliases,
                });
              }
              tracker.add(response.costUsd);
              const callTs = new Date().toISOString();
              const call: Call = {
                id: hashCallId(prompt.id, provider.id, sampleIndex, callTs),
                promptId: prompt.id,
                promptText: prompt.text,
                provider: provider.id,
                model: provider.model,
                sampleIndex,
                response,
                brandCitations: brandCites,
                competitorCitations: compCites,
                timestamp: callTs,
              };
              calls.push(call);
              opts.onProgress?.({
                kind: 'call_done',
                promptId: prompt.id,
                provider: provider.id,
                sampleIndex,
                costUsd: response.costUsd,
                totalUsd: tracker.totalUsd,
              });
            } catch (err) {
              opts.onProgress?.({
                kind: 'call_failed',
                promptId: prompt.id,
                provider: provider.id,
                sampleIndex,
                error: (err as Error).message,
              });
            }
          }),
        );
      }
    }
  }

  await Promise.all(tasks);

  const totalLatencyMs = calls.reduce((s, c) => s + c.response.latencyMs, 0);
  return {
    id: `${opts.config.domain}-${ts}`,
    domain: opts.config.domain,
    timestamp: ts,
    config: opts.config,
    prompts: opts.prompts,
    calls,
    totalCostUsd: tracker.totalUsd,
    totalLatencyMs,
    providers: opts.providers.map((p) => p.id),
    samplesPerProvider: opts.samples,
    dryRun: opts.dryRun ?? false,
  };
}
