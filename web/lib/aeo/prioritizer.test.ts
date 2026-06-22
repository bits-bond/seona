import { describe, it, expect } from 'vitest';
import { prioritize } from './prioritizer';
import { generateEeatRecommendations } from './artifacts/eeat-recommendations';
import type { BrandConfig, Score } from './types';

const config: BrandConfig = {
  domain: 'example.com',
  brandName: 'Example',
  aliases: [],
  language: 'de',
  logoPath: null,
  accentColor: '#000',
  competitors: [],
};

function baseScore(overall: number): Score {
  return {
    overall,
    brandCitationRate: 0.2,
    bestCompetitorRate: 0.6,
    gapPoints: 40,
    perProvider: { openai: 20, anthropic: 30, gemini: 10 },
    perPrompt: [],
    interpretation: 'test',
  };
}

describe('prioritize', () => {
  it('puts robots-patch first when changes exist', () => {
    const items = prioritize({
      config,
      score: baseScore(50),
      recommendations: [],
      eeat: generateEeatRecommendations(config),
      llmsTxtMissing: true,
      robotsPatchChanges: ['GPTBot freigeben'],
    });
    expect(items[0].source).toBe('robots-patch');
    expect(items[0].severity).toBe('critical');
  });

  it('escalates severity to critical when overall score is very low', () => {
    const items = prioritize({
      config,
      score: baseScore(20),
      recommendations: [],
      eeat: generateEeatRecommendations(config),
      llmsTxtMissing: false,
      robotsPatchChanges: [],
    });
    expect(items.some((i) => i.severity === 'critical' && i.source === 'score')).toBe(true);
  });

  it('orders by severity then impact-effort', () => {
    const items = prioritize({
      config,
      score: baseScore(70),
      recommendations: [],
      eeat: generateEeatRecommendations(config),
      llmsTxtMissing: false,
      robotsPatchChanges: [],
    });
    for (let i = 1; i < items.length; i += 1) {
      const rank = (s: string) => ({ critical: 4, high: 3, medium: 2, low: 1 }[s] ?? 0);
      expect(rank(items[i - 1].severity)).toBeGreaterThanOrEqual(rank(items[i].severity));
    }
  });
});
