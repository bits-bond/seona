import type { LLMProvider, ProviderId, ProviderResponse } from '../types';

export interface ProviderPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  searchCallUsd?: number;
}

export function calculateCost(
  tokensIn: number,
  tokensOut: number,
  pricing: ProviderPricing,
  searchCalls = 0,
): number {
  const inputCost = (tokensIn / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (tokensOut / 1_000_000) * pricing.outputPerMillion;
  const searchCost = searchCalls * (pricing.searchCallUsd ?? 0);
  return inputCost + outputCost + searchCost;
}

export abstract class BaseProvider implements LLMProvider {
  abstract id: ProviderId;
  abstract model: string;
  abstract query(prompt: string): Promise<ProviderResponse>;
}

export class FixtureProvider extends BaseProvider {
  constructor(
    public readonly id: ProviderId,
    public readonly model: string,
    private readonly fixture: ProviderResponse,
  ) {
    super();
  }

  async query(_prompt: string): Promise<ProviderResponse> {
    return {
      ...this.fixture,
      latencyMs: Math.floor(50 + Math.random() * 100),
    };
  }
}
