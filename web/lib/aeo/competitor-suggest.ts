import { scrapePage } from './scraper';
import { wrapUntrusted, reminder } from './injection-defense';
import type {
  BrandConfig,
  LLMProvider,
  Score,
  SuggestRecommendation,
} from './types';

export interface SuggestOptions {
  config: BrandConfig;
  score: Score;
  provider: LLMProvider | null;
  maxGaps?: number;
}

export async function suggestRecommendations(opts: SuggestOptions): Promise<SuggestRecommendation[]> {
  const gaps = opts.score.perPrompt
    .filter((p) => p.gap > 0.15 && p.topCompetitor)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, opts.maxGaps ?? 5);

  if (gaps.length === 0 || !opts.provider) return [];

  const brandPage = await scrapePage(`https://${opts.config.domain}`, { respectRobots: true });

  const recs: SuggestRecommendation[] = [];
  for (const gap of gaps) {
    const competitor = opts.config.competitors.find((c) => c.brandName === gap.topCompetitor);
    if (!competitor) continue;
    const compPage = await scrapePage(`https://${competitor.domain}`, { respectRobots: true });
    const userPrompt = buildPrompt(opts.config, gap.promptText, brandPage.mainText ?? '', competitor.brandName, compPage.mainText ?? '');
    try {
      const resp = await opts.provider.query(userPrompt);
      const recommendations = parseRecommendations(resp.text);
      recs.push({
        promptId: gap.promptId,
        competitor: competitor.brandName,
        gapDescription: `${competitor.brandName} wird bei "${gap.promptText}" mit ${(gap.competitorRates[competitor.brandName] * 100).toFixed(0)}% Rate zitiert, ${opts.config.brandName} mit ${(gap.brandRate * 100).toFixed(0)}%.`,
        recommendations,
      });
    } catch {
      // Skip on failure; continue with remaining gaps
    }
  }
  return recs;
}

function buildPrompt(
  brand: BrandConfig,
  query: string,
  brandText: string,
  competitorName: string,
  competitorText: string,
): string {
  return [
    `Du bist Senior-Content-Stratege und vergleichst zwei Webseiten zu folgender Suchanfrage:`,
    `Anfrage: "${query}"`,
    ``,
    `Meine Marke ist "${brand.brandName}" (Domain: ${brand.domain}).`,
    `Der Wettbewerber ist "${competitorName}".`,
    ``,
    `Im Folgenden findest du den Hauptinhalt beider Seiten. Identifiziere 3–5 konkrete`,
    `inhaltliche Lücken, die ${brand.brandName} im Vergleich zu ${competitorName} hat,`,
    `und gib jeweils eine umsetzbare Empfehlung.`,
    ``,
    wrapUntrusted(`${brand.brandName} Hauptinhalt`, brandText),
    ``,
    wrapUntrusted(`${competitorName} Hauptinhalt`, competitorText),
    ``,
    reminder(),
    ``,
    `Antworte als nummerierte Liste mit kurzen, umsetzbaren Empfehlungen.`,
    `Format: "1. <Empfehlung in einem Satz>"`,
    `Maximal 5 Empfehlungen.`,
  ].join('\n');
}

function parseRecommendations(text: string): string[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  const re = /^[\-*]?\s*\d+[.)\]]\s*(.+)$/;
  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue;
    const s = m[1].trim().replace(/^["']|["']$/g, '').trim();
    if (s.length < 8) continue;
    out.push(s);
    if (out.length >= 5) break;
  }
  return out;
}
