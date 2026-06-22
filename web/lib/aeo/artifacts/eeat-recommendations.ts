import type { BrandConfig } from '../types';

export interface EeatRec {
  area: string;
  recommendation: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export function generateEeatRecommendations(config: BrandConfig): EeatRec[] {
  return [
    {
      area: 'Autor-Markup',
      recommendation: `Füge auf jedem Artikel/Blog eine sichtbare Author-Byline mit Foto, Kurz-Bio und Verlinkung zu LinkedIn/Wikipedia ein. Verknüpfe ProfilePage-Schema (Person → worksFor: ${config.brandName}).`,
      effort: 'medium',
      impact: 'high',
    },
    {
      area: 'Erfahrungs-Signale',
      recommendation:
        'Quantifizierbare Erfahrungs-Claims auf der Homepage: Anzahl Projekte, Jahre am Markt, Branchen, Kundennamen (falls erlaubt). Beispiel: "Seit 2018, 80+ Projekte, Branchenfokus DACH-SaaS".',
      effort: 'low',
      impact: 'high',
    },
    {
      area: 'Quellenangaben',
      recommendation:
        'Für jede Behauptung mit Zahl/Statistik eine sichtbare Quellenangabe mit Link zur Primärquelle. Vermeide unbelegte Marketing-Aussagen.',
      effort: 'medium',
      impact: 'medium',
    },
    {
      area: 'Aktualisierungsdaten',
      recommendation:
        'Sichtbares "Veröffentlicht am" und "Aktualisiert am" auf jeder Content-Seite. Im JSON-LD via datePublished + dateModified spiegeln.',
      effort: 'low',
      impact: 'medium',
    },
    {
      area: 'Vertrauenssignale',
      recommendation:
        'Sichtbarer Impressum-/Kontakt-Block, Datenschutz-Link, Adresse, Telefon. Logos von Kunden/Partnern auf Homepage (mit deren Einverständnis).',
      effort: 'low',
      impact: 'medium',
    },
    {
      area: 'Original-Daten',
      recommendation:
        'Führe einmal pro Quartal eine eigene Mini-Studie/Umfrage durch und veröffentliche die Rohdaten + Methodik. Original-Daten werden von ChatGPT/Perplexity überdurchschnittlich zitiert.',
      effort: 'high',
      impact: 'high',
    },
    {
      area: 'Entity-Sichtbarkeit',
      recommendation: `Lege/aktualisiere Wikidata-Eintrag für ${config.brandName}, ergänze sameAs-Links in Organization-Schema zu LinkedIn, Crunchbase, GitHub, YouTube.`,
      effort: 'medium',
      impact: 'high',
    },
    {
      area: 'Community-Signale',
      recommendation:
        'Aktive Reddit-/Indie-Hackers-Präsenz mit fachlichen Antworten in relevanten Subreddits. Perplexity zitiert Reddit zu ~47 %.',
      effort: 'high',
      impact: 'high',
    },
  ];
}
