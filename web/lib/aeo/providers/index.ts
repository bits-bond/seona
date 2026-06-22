import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { FixtureProvider } from './base';
import { promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';
import type { LLMProvider, ProviderId, ProviderResponse } from '../types';

export interface BuildProvidersOpts {
  dryRun?: boolean;
  enabled?: ProviderId[];
  fixtureDir?: string;
}

const ALL: ProviderId[] = ['openai', 'anthropic', 'gemini'];

export async function buildProviders(opts: BuildProvidersOpts = {}): Promise<{
  providers: LLMProvider[];
  skipped: Array<{ id: ProviderId; reason: string }>;
}> {
  const enabled = opts.enabled ?? ALL;
  const providers: LLMProvider[] = [];
  const skipped: Array<{ id: ProviderId; reason: string }> = [];

  if (opts.dryRun) {
    const dir = opts.fixtureDir ?? resolve(__dirname, '..', 'fixtures');
    for (const id of enabled) {
      const fx = await loadFixture(dir, id);
      if (!fx) {
        skipped.push({ id, reason: `fixture not found in ${dir}` });
        continue;
      }
      providers.push(new FixtureProvider(id, fx.model, fx));
    }
    return { providers, skipped };
  }

  for (const id of enabled) {
    if (id === 'openai') {
      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        skipped.push({ id, reason: 'OPENAI_API_KEY not set' });
        continue;
      }
      providers.push(new OpenAIProvider(key, process.env.AEO_OPENAI_MODEL));
    } else if (id === 'anthropic') {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) {
        skipped.push({ id, reason: 'ANTHROPIC_API_KEY not set' });
        continue;
      }
      providers.push(new AnthropicProvider(key, process.env.AEO_ANTHROPIC_MODEL));
    } else if (id === 'gemini') {
      const key = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
      if (!key) {
        skipped.push({ id, reason: 'GOOGLE_API_KEY (or GEMINI_API_KEY) not set' });
        continue;
      }
      providers.push(new GeminiProvider(key, process.env.AEO_GEMINI_MODEL));
    }
  }
  return { providers, skipped };
}

async function loadFixture(dir: string, id: ProviderId): Promise<ProviderResponse | null> {
  try {
    const raw = await fs.readFile(join(dir, `${id}-response.json`), 'utf8');
    return JSON.parse(raw) as ProviderResponse;
  } catch {
    return null;
  }
}
