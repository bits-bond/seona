import type {
  Call,
  PromptProviderRate,
  ProviderId,
  Run,
  Score,
} from './types';

function rate(numHits: number, total: number): number {
  return total === 0 ? 0 : numHits / total;
}

export function computeScore(run: Run): Score {
  const calls = run.calls;
  const totalCalls = calls.length;
  const brandHits = calls.filter((c) => c.brandCitations.length > 0).length;
  const brandRate = rate(brandHits, totalCalls);

  const competitorTotals = new Map<string, number>();
  for (const c of calls) {
    for (const [comp, hits] of Object.entries(c.competitorCitations)) {
      if (hits.length > 0) {
        competitorTotals.set(comp, (competitorTotals.get(comp) ?? 0) + 1);
      }
    }
  }
  let bestCompetitor = '';
  let bestCompRate = 0;
  for (const [comp, hits] of competitorTotals.entries()) {
    const r = rate(hits, totalCalls);
    if (r > bestCompRate) {
      bestCompRate = r;
      bestCompetitor = comp;
    }
  }

  const perProvider: Record<ProviderId, number> = {} as Record<ProviderId, number>;
  const providers = new Set<ProviderId>();
  for (const c of calls) providers.add(c.provider);
  for (const p of providers) {
    const subset = calls.filter((c) => c.provider === p);
    const hits = subset.filter((c) => c.brandCitations.length > 0).length;
    perProvider[p] = Math.round(rate(hits, subset.length) * 100);
  }

  const perPromptMap = groupCalls(calls);
  const perPrompt: PromptProviderRate[] = [];
  for (const [promptId, promptCalls] of perPromptMap.entries()) {
    const byProvider = new Map<ProviderId, Call[]>();
    for (const c of promptCalls) {
      const arr = byProvider.get(c.provider) ?? [];
      arr.push(c);
      byProvider.set(c.provider, arr);
    }
    for (const [provider, providerCalls] of byProvider.entries()) {
      const brandRateP = rate(
        providerCalls.filter((c) => c.brandCitations.length > 0).length,
        providerCalls.length,
      );
      const compRates: Record<string, number> = {};
      let topComp = '';
      let topR = 0;
      const compSet = new Set<string>();
      for (const c of providerCalls) {
        for (const k of Object.keys(c.competitorCitations)) compSet.add(k);
      }
      for (const comp of compSet) {
        const hits = providerCalls.filter((c) => (c.competitorCitations[comp]?.length ?? 0) > 0).length;
        const r = rate(hits, providerCalls.length);
        compRates[comp] = r;
        if (r > topR) {
          topR = r;
          topComp = comp;
        }
      }
      perPrompt.push({
        promptId,
        promptText: providerCalls[0]?.promptText ?? '',
        provider,
        brandRate: brandRateP,
        competitorRates: compRates,
        topCompetitor: topComp || undefined,
        gap: Math.max(0, topR - brandRateP),
      });
    }
  }

  const gapPoints = Math.max(0, bestCompRate - brandRate) * 100;
  const overall = computeOverall(brandRate, bestCompRate);
  const interpretation = interpret(overall, gapPoints);

  return {
    overall,
    brandCitationRate: brandRate,
    bestCompetitorRate: bestCompRate,
    gapPoints,
    perProvider,
    perPrompt,
    interpretation,
  };
}

function groupCalls(calls: Call[]): Map<string, Call[]> {
  const m = new Map<string, Call[]>();
  for (const c of calls) {
    const arr = m.get(c.promptId) ?? [];
    arr.push(c);
    m.set(c.promptId, arr);
  }
  return m;
}

/**
 * Overall score 0–100. Brand presence pulls up; competitor lead pulls down.
 * brand=100% & no_competitor → 100. brand=0% & best_comp=100% → ~0.
 */
function computeOverall(brandRate: number, bestCompRate: number): number {
  const base = brandRate * 100;
  const penalty = Math.max(0, bestCompRate - brandRate) * 60;
  return Math.max(0, Math.min(100, Math.round(base - penalty + (1 - bestCompRate) * 10)));
}

function interpret(overall: number, gapPoints: number): string {
  if (overall >= 80) return 'Sehr starke KI-Sichtbarkeit. Halten und ausbauen.';
  if (overall >= 60) return 'Solide Sichtbarkeit mit gezielten Optimierungspotenzialen.';
  if (overall >= 40) return 'Mittelmäßige Sichtbarkeit. Wettbewerb deutlich vor.';
  if (overall >= 20) return 'Schwache Sichtbarkeit. Strukturelle Maßnahmen nötig.';
  return `Sehr niedrige Sichtbarkeit (Gap ${gapPoints.toFixed(0)} Punkte). Sofortmaßnahmen empfohlen.`;
}
