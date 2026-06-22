import { describe, it, expect } from 'vitest';
import { parseCitations, normalizeDomain, extractGroundedSources } from './citation-parser';
import type { ProviderResponse } from './types';

function buildResponse(text: string, urls: string[] = []): ProviderResponse {
  return {
    text,
    searchResults: urls.map((u) => ({ url: u })),
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    latencyMs: 0,
    model: 'test',
  };
}

describe('normalizeDomain', () => {
  it('strips www and protocol', () => {
    expect(normalizeDomain('https://www.bitsandbond.com')).toBe('bitsandbond.com');
    expect(normalizeDomain('bitsandbond.com')).toBe('bitsandbond.com');
    expect(normalizeDomain('https://sub.example.com/path?q=1')).toBe('sub.example.com');
  });
});

describe('parseCitations', () => {
  it('detects brand mention via word boundary', () => {
    const r = buildResponse('Wir empfehlen Bits & Bond für moderne Webdesigns.');
    const cites = parseCitations(r, { domain: 'bitsandbond.com', brandName: 'Bits & Bond', aliases: [] });
    expect(cites.some((c) => c.kind === 'brand_mention')).toBe(true);
  });

  it('detects URL match via domain normalization', () => {
    const r = buildResponse('Mehr unter unserer Website.', ['https://www.bitsandbond.com/about']);
    const cites = parseCitations(r, { domain: 'bitsandbond.com', brandName: 'Bits & Bond', aliases: [] });
    expect(cites.some((c) => c.kind === 'url_match')).toBe(true);
  });

  it('does not double-count brand mentions', () => {
    const r = buildResponse('Bits & Bond ist toll. Bits & Bond ist super.');
    const cites = parseCitations(r, { domain: 'bitsandbond.com', brandName: 'Bits & Bond', aliases: [] });
    const brand = cites.filter((c) => c.kind === 'brand_mention');
    expect(brand).toHaveLength(1);
  });

  it('respects word boundaries (no substring match)', () => {
    const r = buildResponse('Acme Corp ist hier.');
    const cites = parseCitations(r, { domain: 'cme.com', brandName: 'cme', aliases: [] });
    expect(cites.filter((c) => c.kind === 'brand_mention')).toHaveLength(0);
  });

  it('matches subdomain URLs as belonging to brand', () => {
    const r = buildResponse('', ['https://blog.bitsandbond.com/post']);
    const cites = parseCitations(r, { domain: 'bitsandbond.com', brandName: 'Bits & Bond', aliases: [] });
    expect(cites.some((c) => c.kind === 'url_match')).toBe(true);
  });
});

describe('extractGroundedSources', () => {
  it('returns unique domains from search results', () => {
    const r = buildResponse('', ['https://a.com/1', 'https://www.a.com/2', 'https://b.com/x']);
    const out = extractGroundedSources(r);
    expect(out).toContain('a.com');
    expect(out).toContain('b.com');
    expect(out.length).toBe(2);
  });
});
