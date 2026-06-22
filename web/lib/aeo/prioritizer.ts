import type { ActionItem, BrandConfig, Score, SuggestRecommendation } from './types';
import type { EeatRec } from './artifacts/eeat-recommendations';

export interface PrioritizerInput {
  config: BrandConfig;
  score: Score;
  recommendations: SuggestRecommendation[];
  eeat: EeatRec[];
  llmsTxtMissing: boolean;
  robotsPatchChanges: string[];
}

function id(prefix: string, idx: number): string {
  return `${prefix}-${idx.toString().padStart(2, '0')}`;
}

export function prioritize(input: PrioritizerInput): ActionItem[] {
  const items: ActionItem[] = [];
  let idx = 0;

  if (input.robotsPatchChanges.length > 0) {
    idx += 1;
    items.push({
      id: id('robots', idx),
      title: 'robots.txt für KI-Crawler freigeben',
      description: `Folgende Crawler explizit erlauben: ${input.robotsPatchChanges.join(', ')}. Patch ist in artifacts/robots-patch.diff bereit zum Anwenden.`,
      severity: 'critical',
      impactScore: 9,
      effortScore: 1,
      source: 'robots-patch',
    });
  }

  if (input.llmsTxtMissing) {
    idx += 1;
    items.push({
      id: id('llms', idx),
      title: 'llms.txt im Site-Root deployen',
      description: 'Datei artifacts/llms.txt im Root der Domain unter /llms.txt veröffentlichen. Strukturierte Inhalts-Hinweise für ChatGPT, Claude und Perplexity.',
      severity: 'high',
      impactScore: 8,
      effortScore: 1,
      source: 'llms-txt',
    });
  }

  idx += 1;
  items.push({
    id: id('schema', idx),
    title: 'JSON-LD-Schema (Organization, Person, Article) einbinden',
    description: 'Generierte JSON-LD-Snippets aus artifacts/schema.jsonld in den <head>-Bereich der entsprechenden Seiten kopieren. Erhöht Entity-Klarheit für AI-Crawler.',
    severity: 'high',
    impactScore: 7,
    effortScore: 2,
    source: 'schema-jsonld',
  });

  // Citation gaps → high priority based on gap size
  for (const r of input.recommendations) {
    for (const rec of r.recommendations.slice(0, 3)) {
      idx += 1;
      items.push({
        id: id('gap', idx),
        title: `Content-Lücke vs ${r.competitor}: ${rec.slice(0, 60)}${rec.length > 60 ? '…' : ''}`,
        description: `${r.gapDescription}\n\nEmpfehlung: ${rec}`,
        severity: 'high',
        impactScore: 8,
        effortScore: 5,
        source: 'competitor-suggest',
      });
    }
  }

  // E-E-A-T quick wins (low effort, high impact first)
  const sortedEeat = [...input.eeat].sort((a, b) => {
    const score = (r: EeatRec) => impactMap(r.impact) * 2 - effortMap(r.effort);
    return score(b) - score(a);
  });
  for (const r of sortedEeat) {
    idx += 1;
    items.push({
      id: id('eeat', idx),
      title: `E-E-A-T: ${r.area}`,
      description: r.recommendation,
      severity: r.impact === 'high' && r.effort === 'low' ? 'high' : r.impact === 'high' ? 'medium' : 'medium',
      impactScore: impactMap(r.impact) * 3,
      effortScore: effortMap(r.effort) * 2,
      source: 'eeat',
    });
  }

  // Score-based generic recommendations
  if (input.score.overall < 40) {
    idx += 1;
    items.push({
      id: id('score', idx),
      title: 'Niedrige KI-Sichtbarkeit: strukturelle Maßnahmen einleiten',
      description: `Aktueller Score ${input.score.overall}/100 mit Gap ${input.score.gapPoints.toFixed(0)} Punkten zum stärksten Wettbewerber. Empfohlen: kombinierte Maßnahmen aus Schema, llms.txt, Reddit-Präsenz und Wikipedia-Eintrag innerhalb der nächsten 30 Tage.`,
      severity: 'critical',
      impactScore: 10,
      effortScore: 8,
      source: 'score',
    });
  }

  return items.sort((a, b) => {
    const sev = severityRank(b.severity) - severityRank(a.severity);
    if (sev !== 0) return sev;
    return b.impactScore - a.impactScore - (b.effortScore - a.effortScore);
  });
}

function impactMap(i: EeatRec['impact']): number {
  return { low: 1, medium: 2, high: 3 }[i];
}
function effortMap(e: EeatRec['effort']): number {
  return { low: 1, medium: 2, high: 3 }[e];
}
function severityRank(s: ActionItem['severity']): number {
  return { critical: 4, high: 3, medium: 2, low: 1 }[s];
}
