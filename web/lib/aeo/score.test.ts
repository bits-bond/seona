import { describe, it, expect } from 'vitest';
import { computeScore } from './score';
import type { Call, Run } from './types';

function call(
  promptId: string,
  provider: 'openai' | 'anthropic' | 'gemini',
  brand: boolean,
  competitors: Record<string, boolean> = {},
  sampleIndex = 0,
): Call {
  return {
    id: `${promptId}-${provider}-${sampleIndex}`,
    promptId,
    promptText: `Prompt ${promptId}`,
    provider,
    model: `${provider}-test`,
    sampleIndex,
    response: { text: '', searchResults: [], tokensIn: 0, tokensOut: 0, costUsd: 0, latencyMs: 0, model: `${provider}-test` },
    brandCitations: brand ? [{ kind: 'brand_mention', entity: 'Brand' }] : [],
    competitorCitations: Object.fromEntries(
      Object.entries(competitors).map(([k, v]) => [k, v ? [{ kind: 'brand_mention', entity: k }] : []]),
    ),
    timestamp: new Date().toISOString(),
  };
}

function buildRun(calls: Call[]): Run {
  return {
    id: 'test',
    domain: 'example.com',
    timestamp: new Date().toISOString(),
    config: {
      domain: 'example.com',
      brandName: 'Brand',
      aliases: [],
      language: 'de',
      logoPath: null,
      accentColor: '#000',
      competitors: [],
    },
    prompts: [],
    calls,
    totalCostUsd: 0,
    totalLatencyMs: 0,
    providers: [...new Set(calls.map((c) => c.provider))],
    samplesPerProvider: 1,
    dryRun: true,
  };
}

describe('computeScore', () => {
  it('returns 100 when brand is cited everywhere and no competitor', () => {
    const run = buildRun([call('p1', 'openai', true), call('p1', 'anthropic', true)]);
    const score = computeScore(run);
    expect(score.overall).toBeGreaterThan(85);
    expect(score.brandCitationRate).toBe(1);
    expect(score.bestCompetitorRate).toBe(0);
  });

  it('returns low score when only competitor is cited', () => {
    const run = buildRun([
      call('p1', 'openai', false, { Acme: true }),
      call('p1', 'anthropic', false, { Acme: true }),
    ]);
    const score = computeScore(run);
    expect(score.overall).toBeLessThan(30);
    expect(score.bestCompetitorRate).toBe(1);
    expect(score.gapPoints).toBeCloseTo(100, 0);
  });

  it('computes per-provider rates correctly', () => {
    const run = buildRun([
      call('p1', 'openai', true),
      call('p1', 'openai', true),
      call('p1', 'anthropic', false),
      call('p1', 'anthropic', false),
    ]);
    const score = computeScore(run);
    expect(score.perProvider.openai).toBe(100);
    expect(score.perProvider.anthropic).toBe(0);
  });

  it('identifies top competitor in per-prompt breakdown', () => {
    const run = buildRun([
      call('p1', 'openai', false, { Acme: true, Other: false }),
      call('p1', 'openai', false, { Acme: true, Other: true }),
    ]);
    const score = computeScore(run);
    const p1 = score.perPrompt.find((p) => p.promptId === 'p1' && p.provider === 'openai');
    expect(p1?.topCompetitor).toBe('Acme');
    expect(p1?.gap).toBe(1);
  });
});
