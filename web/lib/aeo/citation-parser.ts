import type { Citation, ProviderResponse } from './types';

export function normalizeDomain(input: string): string {
  let url = input.trim().toLowerCase();
  if (!url.startsWith('http')) url = `https://${url}`;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return input.toLowerCase().replace(/^www\./, '');
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findBrandMentions(text: string, names: string[]): string[] {
  const matches: string[] = [];
  for (const name of names) {
    if (!name) continue;
    const re = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i');
    if (re.test(text)) matches.push(name);
  }
  return matches;
}

function findUrlMatches(searchResults: ProviderResponse['searchResults'], domain: string): string[] {
  const target = normalizeDomain(domain);
  const hits: string[] = [];
  for (const r of searchResults) {
    const host = normalizeDomain(r.url);
    if (host === target || host.endsWith(`.${target}`)) {
      hits.push(r.url);
    }
  }
  return hits;
}

export interface ParseTarget {
  domain: string;
  brandName: string;
  aliases: string[];
}

export function parseCitations(response: ProviderResponse, target: ParseTarget): Citation[] {
  const cites: Citation[] = [];
  const seen = new Set<string>();
  const names = [target.brandName, ...target.aliases].filter(Boolean);

  for (const name of findBrandMentions(response.text, names)) {
    const key = `brand:${name.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      cites.push({ kind: 'brand_mention', entity: name });
    }
  }

  for (const url of findUrlMatches(response.searchResults, target.domain)) {
    const key = `url:${url}`;
    if (!seen.has(key)) {
      seen.add(key);
      cites.push({ kind: 'url_match', entity: target.domain, url });
    }
  }

  // grounded sources from search results (any URL that is not our domain — useful for competitive context).
  // Not added as our citation here — these are computed per competitor or via separate call.

  return cites;
}

export function extractGroundedSources(response: ProviderResponse): string[] {
  const out = new Set<string>();
  for (const r of response.searchResults) out.add(normalizeDomain(r.url));
  return [...out];
}
