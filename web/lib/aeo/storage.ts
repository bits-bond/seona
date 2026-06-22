import { promises as fs } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import {
  BrandConfigSchema,
  PromptSchema,
  RunSchema,
  type BrandConfig,
  type Prompt,
  type Run,
} from './types';

const OUTPUT_ROOT = resolve(process.cwd(), '..', 'output');

export function aeoDir(domain: string): string {
  const safe = domain.replace(/[/\\:?*"<>|]/g, '_');
  return join(OUTPUT_ROOT, safe, 'aeo');
}

async function ensureDir(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true });
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  await ensureDir(dirname(path));
  await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf8');
}

export async function readJson<T>(path: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeText(path: string, content: string): Promise<void> {
  await ensureDir(dirname(path));
  await fs.writeFile(path, content, 'utf8');
}

export async function readText(path: string): Promise<string | null> {
  try {
    return await fs.readFile(path, 'utf8');
  } catch {
    return null;
  }
}

export async function saveConfig(domain: string, cfg: BrandConfig): Promise<string> {
  const path = join(aeoDir(domain), 'config.json');
  await writeJson(path, cfg);
  return path;
}

export async function loadConfig(domain: string): Promise<BrandConfig | null> {
  const path = join(aeoDir(domain), 'config.json');
  const raw = await readJson<unknown>(path);
  if (!raw) return null;
  return BrandConfigSchema.parse(raw);
}

export async function savePrompts(domain: string, prompts: Prompt[]): Promise<string> {
  const path = join(aeoDir(domain), 'prompts.json');
  await writeJson(path, prompts);
  return path;
}

export async function loadPrompts(domain: string): Promise<Prompt[] | null> {
  const path = join(aeoDir(domain), 'prompts.json');
  const raw = await readJson<unknown[]>(path);
  if (!raw) return null;
  return raw.map((p) => PromptSchema.parse(p));
}

export async function saveRun(domain: string, run: Run): Promise<string> {
  const dir = join(aeoDir(domain), 'runs');
  await ensureDir(dir);
  const safeTs = run.timestamp.replace(/[:.]/g, '-');
  const path = join(dir, `${safeTs}.json`);
  await writeJson(path, run);
  await writeJson(join(aeoDir(domain), 'latest.json'), run);
  return path;
}

export async function loadLatestRun(domain: string): Promise<Run | null> {
  const path = join(aeoDir(domain), 'latest.json');
  const raw = await readJson<unknown>(path);
  if (!raw) return null;
  return RunSchema.parse(raw);
}

export function artifactsDir(domain: string): string {
  return join(aeoDir(domain), 'artifacts');
}

export function reportPath(domain: string, ext: 'html' | 'pdf'): string {
  return join(aeoDir(domain), `report.${ext}`);
}
