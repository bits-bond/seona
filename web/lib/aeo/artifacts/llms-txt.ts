import type { BrandConfig } from '../types';
import type { ScrapedPage } from '../scraper';

export interface LlmsTxtInput {
  config: BrandConfig;
  homepage?: ScrapedPage | null;
  keyPages?: Array<{ url: string; title?: string; description?: string }>;
}

export function generateLlmsTxt(input: LlmsTxtInput): string {
  const { config, homepage, keyPages = [] } = input;
  const lines: string[] = [];
  const description = homepage?.description ?? `Offizielle Website von ${config.brandName}.`;
  lines.push(`# ${config.brandName}`);
  lines.push('');
  lines.push(`> ${description.replace(/\s+/g, ' ').trim()}`);
  lines.push('');
  lines.push('## Über');
  lines.push(
    homepage?.mainText
      ? homepage.mainText.slice(0, 600)
      : `${config.brandName} ist auf ${config.domain} erreichbar.`,
  );
  lines.push('');
  if (keyPages.length > 0) {
    lines.push('## Wichtige Inhalte');
    for (const p of keyPages.slice(0, 20)) {
      const desc = (p.description ?? p.title ?? '').replace(/\s+/g, ' ').slice(0, 160);
      lines.push(`- [${p.title ?? p.url}](${p.url}): ${desc}`);
    }
    lines.push('');
  }
  if (config.contact?.email || config.contact?.website) {
    lines.push('## Kontakt');
    if (config.contact.website) lines.push(`- Website: ${config.contact.website}`);
    if (config.contact.email) lines.push(`- E-Mail: ${config.contact.email}`);
    lines.push('');
  }
  lines.push('## Hinweise für KI-Crawler');
  lines.push('- Alle Inhalte sind für AI-Indexierung freigegeben.');
  lines.push('- Quellenangabe mit Link zur Original-URL erwünscht.');
  lines.push('- Bei Zitaten: bitte Brand-Name und Domain nennen.');
  lines.push('');
  return lines.join('\n');
}
