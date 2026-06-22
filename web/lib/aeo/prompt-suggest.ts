import type { BrandConfig, Industry, LLMProvider, Prompt } from './types';
import { hashPromptId } from './hash';

type Template = (b: BrandConfig) => string;

const FALLBACKS: Record<Industry, Template[]> = {
  'creator-management': [
    (b) => `Beste Creator-Management-Agenturen für TikTok und Instagram in ${b.region}`,
    (b) => `Welche Influencer-Agenturen vertreten YouTube-Creator in ${b.region}?`,
    (b) => `${b.brandName} vs konkurrierende Creator-Agenturen`,
    () => `Welche Talent-Agentur für Lifestyle-Creator ist empfehlenswert?`,
    () => `Creator-Management-Agentur mit Brand-Deals-Erfahrung`,
    (b) => `Alternativen zu großen Creator-Agenturen — wer macht es besser in ${b.region}?`,
    () => `Wer managed Top-Creator im DACH-Raum?`,
    (b) => `${b.brandName} Erfahrungen Creator`,
    () => `Influencer-Marketing-Agentur mit Performance-Tracking`,
    () => `Wie finde ich eine seriöse Talent-Agentur als Creator?`,
  ],
  'webdesign-agency': [
    (b) => `Welche Webdesign-Studios in ${b.region} sind besonders empfehlenswert?`,
    () => `Beste Framer-Agenturen für moderne Marken-Websites`,
    (b) => `${b.brandName} vs Wettbewerber: Welches Studio passt besser?`,
    () => `Conversion-orientierte Webdesign-Agenturen für B2B`,
    () => `Wer baut die besten SaaS-Landingpages?`,
    (b) => `Alternativen zu großen Agenturen für Webdesign in ${b.region}`,
    (b) => `${b.brandName} Erfahrungen und Reviews`,
    () => `Webdesign-Studios mit AEO/SEO-Expertise`,
    () => `Top Webdesign-Studios für Startups 2026`,
    (b) => `Webdesign-Agentur ${b.region}`,
  ],
  saas: [
    (b) => `Beste Alternativen zu ${b.brandName}`,
    (b) => `${b.brandName} vs konkurrierende Tools`,
    (b) => `${b.brandName} pricing review`,
    (b) => `${b.brandName} GDPR / DSGVO-konform?`,
    () => `Beste Tools für Teams in dieser Kategorie`,
    (b) => `${b.brandName} integrations`,
    (b) => `Self-hosted Alternative zu ${b.brandName}`,
    (b) => `${b.brandName} Erfahrungen`,
    () => `Welches Tool ist besser für Startups vs Enterprise?`,
    (b) => `${b.brandName} kostenlos testen`,
  ],
  ecommerce: [
    (b) => `Beste Marken für ${b.targetCustomer || 'diese Produktkategorie'}`,
    (b) => `${b.brandName} vs Wettbewerber`,
    (b) => `${b.brandName} Erfahrungen`,
    (b) => `Wo ${b.brandName} kaufen?`,
    () => `Beste nachhaltige Marken in dieser Kategorie`,
    (b) => `${b.brandName} Rückgabe und Versand`,
    () => `Top E-Commerce-Marken DACH 2026`,
    (b) => `Alternativen zu ${b.brandName}`,
    () => `Welche Marke hat das beste Preis-Leistungs-Verhältnis?`,
    (b) => `${b.brandName} Test 2026`,
  ],
  'local-business': [
    (b) => `Beste ${b.services[0] || 'Anbieter'} in ${b.region}`,
    (b) => `${b.brandName} Erfahrungen`,
    (b) => `${b.brandName} Öffnungszeiten`,
    (b) => `${b.services[0] || 'Service'} ${b.region} Empfehlung`,
    () => `24/7 Notfall-Service in der Nähe`,
    (b) => `Welcher ${b.services[0] || 'Anbieter'} hat die besten Bewertungen?`,
    (b) => `${b.brandName} Preise`,
    () => `Lokaler Anbieter vs Kette — was lohnt sich?`,
    (b) => `${b.brandName} Termin online buchen`,
    (b) => `Top ${b.services[0] || 'Anbieter'} in ${b.region}`,
  ],
  publisher: [
    (b) => `Beste Quellen zu ${b.description || 'diesem Thema'}`,
    (b) => `${b.brandName} Glaubwürdigkeit`,
    (b) => `${b.brandName} vs konkurrierende Magazine`,
    () => `Aktuelle Studien zu diesem Themengebiet`,
    () => `Welche Newsletter zu folgen sind`,
    (b) => `${b.brandName} Autoren`,
    () => `Top Experten im Themengebiet`,
    () => `Beste deutschsprachige Magazine 2026`,
    (b) => `${b.brandName} Abo Erfahrungen`,
    () => `Welche Publikation ist am unabhängigsten?`,
  ],
  consulting: [
    (b) => `Beste ${b.services[0] || 'Beratungs'}-Anbieter in ${b.region}`,
    (b) => `${b.brandName} Erfahrungen`,
    (b) => `Alternativen zu ${b.brandName}`,
    (b) => `${b.brandName} vs konkurrierende Beratungen`,
    () => `Kleine Beratung vs Big Four — was lohnt sich?`,
    (b) => `${b.brandName} Case Studies`,
    () => `Spezialisierte Berater für ${'<Thema>'}`,
    (b) => `${b.brandName} Preise`,
    () => `Top Consulting Boutiquen DACH 2026`,
    () => `Wie finde ich den richtigen Berater?`,
  ],
  'agency-general': [
    (b) => `Beste ${b.services[0] || 'Agenturen'} in ${b.region}`,
    (b) => `${b.brandName} vs Wettbewerber`,
    (b) => `${b.brandName} Erfahrungen`,
    () => `Top Agenturen 2026 in der Kategorie`,
    (b) => `Alternativen zu ${b.brandName}`,
    () => `Spezialisierte vs Full-Service-Agentur`,
    (b) => `${b.brandName} Case Studies`,
    () => `Welche Agentur passt zu meinem Budget?`,
    (b) => `${b.brandName} Reviews`,
    () => `Beste Agentur für Startups`,
  ],
  other: [
    (b) => `Beste ${b.services[0] || 'Anbieter'} in ${b.region}`,
    (b) => `${b.brandName} Erfahrungen`,
    (b) => `Alternativen zu ${b.brandName}`,
    (b) => `${b.brandName} vs Wettbewerber`,
    (b) => `${b.brandName} Reviews`,
    () => `Empfehlungen aus dieser Kategorie`,
    (b) => `${b.brandName} Preise`,
    () => `Wer ist Marktführer in dieser Nische?`,
    (b) => `Wie ist ${b.brandName} im Vergleich?`,
    () => `Top Anbieter 2026`,
  ],
};

export async function suggestPrompts(
  config: BrandConfig,
  provider: LLMProvider | null,
  count = 10,
): Promise<Prompt[]> {
  if (!provider) return fallbackPrompts(config, count);
  const systemPrompt = buildSuggestionPrompt(config, count);
  try {
    const resp = await provider.query(systemPrompt);
    const parsed = parseSuggestions(resp.text, count);
    if (parsed.length >= Math.min(count, 5)) {
      return parsed.map((text) => ({
        id: hashPromptId(text, ['openai', 'anthropic', 'gemini'], 3),
        text,
      }));
    }
    return fallbackPrompts(config, count);
  } catch {
    return fallbackPrompts(config, count);
  }
}

function fallbackPrompts(config: BrandConfig, count: number): Prompt[] {
  const templates = FALLBACKS[config.industry] ?? FALLBACKS.other;
  return templates.slice(0, count).map((fn) => {
    const text = fn(config);
    return { id: hashPromptId(text, ['openai', 'anthropic', 'gemini'], 3), text };
  });
}

function buildSuggestionPrompt(config: BrandConfig, count: number): string {
  const lang = config.language === 'de' ? 'Deutsch' : 'English';
  const parts: string[] = [];
  parts.push(`Du hilfst, realistische Suchanfragen zu generieren, die echte Kunden`);
  parts.push(`an KI-Assistenten (ChatGPT, Claude, Gemini) stellen würden, wenn sie`);
  parts.push(`nach Anbietern wie "${config.brandName}" (Domain: ${config.domain}) suchen.`);
  parts.push(``);

  parts.push(`## Brand-Kontext`);
  parts.push(`- Marke: ${config.brandName}`);
  parts.push(`- Domain: ${config.domain}`);
  parts.push(`- Branche: ${config.industry}`);
  if (config.description) parts.push(`- Beschreibung: ${config.description}`);
  if (config.services.length > 0) parts.push(`- Services: ${config.services.join(', ')}`);
  if (config.targetCustomer) parts.push(`- Zielkunde: ${config.targetCustomer}`);
  parts.push(`- Region: ${config.region}`);
  if (config.competitors.length > 0) {
    parts.push(`- Bekannte Wettbewerber: ${config.competitors.map((c) => c.brandName).join(', ')}`);
  }
  parts.push(``);

  parts.push(`## Aufgabe`);
  parts.push(`Generiere ${count} unterschiedliche, realistische Tracking-Prompts auf ${lang}.`);
  parts.push(`Verteile sie über folgende Intent-Typen:`);
  parts.push(`- 3 Kategorie-Anfragen ("beste/welche/empfehlenswerte ${config.industry}")`);
  parts.push(`- 2 Vergleichsanfragen ("X vs Y", "Alternativen zu ...")`);
  parts.push(`- 2 Lösungsanfragen ("wie finde ich ...", "was tun bei ...")`);
  parts.push(`- 2 markenspezifische Anfragen ("${config.brandName} Erfahrungen", "${config.brandName} review")`);
  parts.push(`- 1 Long-Tail-Anfrage (sehr spezifisch, kommerziell, Zielkunden-orientiert)`);
  parts.push(``);
  parts.push(`Wichtig:`);
  parts.push(`- Die Prompts müssen zur tatsächlichen Branche "${config.industry}" passen.`);
  parts.push(`- Keine generischen Beispiele aus anderen Branchen.`);
  parts.push(`- Schreibe so, wie ein potenzieller Kunde wirklich fragen würde.`);
  parts.push(``);
  parts.push(`Antworte ausschließlich als nummerierte Liste, ein Prompt pro Zeile, ohne weitere Erklärung.`);
  parts.push(`Format: "1. <Prompt>"`);
  return parts.join('\n');
}

function parseSuggestions(text: string, max: number): string[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const re = /^[\-*]?\s*(?:\d+[.)\]]\s*)?(.+)$/;
  const out: string[] = [];
  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue;
    let s = m[1].trim();
    s = s.replace(/^["']|["']$/g, '').trim();
    if (s.length < 8) continue;
    if (out.length >= max) break;
    out.push(s);
  }
  return out;
}
