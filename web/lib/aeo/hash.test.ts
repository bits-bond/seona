import { describe, it, expect } from 'vitest';
import { hashPromptId, hashRunId } from './hash';

describe('hashPromptId', () => {
  it('produces deterministic IDs', () => {
    expect(hashPromptId('hello', ['openai'], 3)).toBe(hashPromptId('hello', ['openai'], 3));
  });

  it('is whitespace-and-case insensitive on the prompt text', () => {
    expect(hashPromptId('Hello World', ['openai'], 3)).toBe(hashPromptId('  hello world  ', ['openai'], 3));
  });

  it('changes when providers differ', () => {
    expect(hashPromptId('hello', ['openai'], 3)).not.toBe(hashPromptId('hello', ['anthropic'], 3));
  });

  it('does not change when provider order differs (sorted)', () => {
    expect(hashPromptId('hello', ['openai', 'anthropic'], 3)).toBe(hashPromptId('hello', ['anthropic', 'openai'], 3));
  });
});

describe('hashRunId', () => {
  it('produces a 12-char ID', () => {
    const id = hashRunId('example.com', new Date().toISOString());
    expect(id).toHaveLength(12);
  });
});
