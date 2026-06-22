import { describe, it, expect } from 'vitest';
import { generateLlmsTxt } from './artifacts/llms-txt';
import { generateRobotsPatch } from './artifacts/robots-patch';
import { generateSchemaJsonLd } from './artifacts/schema-jsonld';
import { generateEeatRecommendations } from './artifacts/eeat-recommendations';
import type { BrandConfig } from './types';

const config: BrandConfig = {
  domain: 'bitsandbond.com',
  brandName: 'Bits & Bond',
  aliases: [],
  language: 'de',
  logoPath: null,
  accentColor: '#e05a33',
  competitors: [],
};

describe('generateLlmsTxt', () => {
  it('starts with brand title and contains a description blockquote', () => {
    const out = generateLlmsTxt({ config });
    expect(out.startsWith('# Bits & Bond')).toBe(true);
    expect(out).toMatch(/^>/m);
  });

  it('includes contact section when contact provided', () => {
    const out = generateLlmsTxt({
      config: { ...config, contact: { email: 'hi@bitsandbond.com', website: 'https://bitsandbond.com' } },
    });
    expect(out).toContain('## Kontakt');
    expect(out).toContain('hi@bitsandbond.com');
  });
});

describe('generateRobotsPatch', () => {
  it('adds all AI crawlers when robots.txt is empty', () => {
    const out = generateRobotsPatch({ existing: '' });
    expect(out.fullProposed).toContain('GPTBot');
    expect(out.fullProposed).toContain('ClaudeBot');
    expect(out.fullProposed).toContain('PerplexityBot');
    expect(out.fullProposed).toContain('Google-Extended');
    expect(out.fullProposed).toContain('Applebot-Extended');
    expect(out.changes.length).toBeGreaterThan(0);
  });

  it('appends an AEO block to existing robots.txt without removing existing rules', () => {
    const existing = 'User-agent: *\nDisallow: /admin\n';
    const out = generateRobotsPatch({ existing });
    expect(out.fullProposed).toContain('Disallow: /admin');
    expect(out.fullProposed).toContain('GPTBot');
  });

  it('produces a unified diff with both - and + lines', () => {
    const out = generateRobotsPatch({ existing: 'User-agent: *\nDisallow: /admin\n' });
    expect(out.diff).toMatch(/^--- robots\.txt/m);
    expect(out.diff).toMatch(/^\+\+\+ robots\.txt/m);
    expect(out.diff).toMatch(/^\+User-agent: GPTBot/m);
  });
});

describe('generateSchemaJsonLd', () => {
  it('always emits an Organization block', () => {
    const out = generateSchemaJsonLd({ config });
    expect(out.organization['@type']).toBe('Organization');
    expect(out.organization.name).toBe('Bits & Bond');
    expect(out.combined).toContain('<script type="application/ld+json">');
  });

  it('emits Person when founderName is given', () => {
    const out = generateSchemaJsonLd({ config, founderName: 'Davut' });
    expect(out.person).not.toBeNull();
    expect((out.person as Record<string, unknown>)['@type']).toBe('Person');
  });

  it('emits Article when sampleArticle is given', () => {
    const out = generateSchemaJsonLd({
      config,
      sampleArticle: {
        title: 'Was ist AEO?',
        url: 'https://bitsandbond.com/blog/aeo',
        datePublished: '2026-01-15',
        authorName: 'Davut',
      },
    });
    expect(out.article).not.toBeNull();
    expect((out.article as Record<string, unknown>).headline).toBe('Was ist AEO?');
  });
});

describe('generateEeatRecommendations', () => {
  it('returns at least 6 prioritized recommendations', () => {
    const recs = generateEeatRecommendations(config);
    expect(recs.length).toBeGreaterThanOrEqual(6);
    for (const r of recs) {
      expect(r.area).toBeTruthy();
      expect(r.recommendation).toBeTruthy();
      expect(['low', 'medium', 'high']).toContain(r.impact);
      expect(['low', 'medium', 'high']).toContain(r.effort);
    }
  });
});
