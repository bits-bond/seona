import { createHash } from 'node:crypto';

export function hashPromptId(text: string, providers: string[], samples: number): string {
  const normalized = JSON.stringify({
    text: text.trim().toLowerCase(),
    providers: [...providers].sort(),
    samples,
  });
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

export function hashCallId(promptId: string, provider: string, sampleIndex: number, ts: string): string {
  return createHash('sha256').update(`${promptId}:${provider}:${sampleIndex}:${ts}`).digest('hex').slice(0, 16);
}

export function hashRunId(domain: string, ts: string): string {
  return createHash('sha256').update(`${domain}:${ts}`).digest('hex').slice(0, 12);
}
