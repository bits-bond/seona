import { BrandConfigSchema, type BrandConfig } from './types';
import { loadConfig, saveConfig } from './storage';

function brandFromDomain(domain: string): string {
  const stripped = domain.replace(/^www\./, '').split('.')[0] ?? domain;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

export async function loadOrInitConfig(
  domain: string,
  overrides: Partial<BrandConfig> = {},
): Promise<BrandConfig> {
  const cleanOverrides = Object.fromEntries(
    Object.entries(overrides).filter(([, v]) => v !== undefined),
  );
  const existing = await loadConfig(domain);
  if (existing) {
    if (Object.keys(cleanOverrides).length === 0) return existing;
    const merged = BrandConfigSchema.parse({ ...existing, ...cleanOverrides });
    await saveConfig(domain, merged);
    return merged;
  }
  const initial = BrandConfigSchema.parse({
    domain,
    brandName: cleanOverrides.brandName ?? brandFromDomain(domain),
    language: cleanOverrides.language ?? 'de',
    aliases: cleanOverrides.aliases ?? [],
    competitors: cleanOverrides.competitors ?? [],
    logoPath: cleanOverrides.logoPath ?? null,
    accentColor: cleanOverrides.accentColor ?? '#e05a33',
    industry: cleanOverrides.industry ?? 'other',
    description: cleanOverrides.description ?? '',
    services: cleanOverrides.services ?? [],
    targetCustomer: cleanOverrides.targetCustomer ?? '',
    region: cleanOverrides.region ?? 'DACH',
    contact: cleanOverrides.contact,
  });
  await saveConfig(domain, initial);
  return initial;
}

export function parseCompetitorsArg(raw: string | undefined): BrandConfig['competitors'] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((domain) => ({
      domain,
      brandName: domain.replace(/^www\./, '').split('.')[0] ?? domain,
      aliases: [],
    }));
}
