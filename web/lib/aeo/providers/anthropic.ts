import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider, calculateCost, type ProviderPricing } from './base';
import type { ProviderId, ProviderResponse, SearchResult } from '../types';

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const PRICING: ProviderPricing = {
  inputPerMillion: 3,
  outputPerMillion: 15,
  searchCallUsd: 0.01,
};

export class AnthropicProvider extends BaseProvider {
  readonly id: ProviderId = 'anthropic';
  readonly model: string;
  private client: Anthropic;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    super();
    this.model = model;
    this.client = new Anthropic({ apiKey });
  }

  async query(prompt: string): Promise<ProviderResponse> {
    const start = Date.now();
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 5,
          },
        ] as unknown as Anthropic.Messages.MessageCreateParams['tools'],
      });
    } catch (err) {
      throw new Error(`Anthropic query failed: ${(err as Error).message}`);
    }
    const latencyMs = Date.now() - start;
    const { text, searchResults, searchCalls } = extractFromMessage(response);
    const tokensIn = response.usage?.input_tokens ?? 0;
    const tokensOut = response.usage?.output_tokens ?? 0;
    const costUsd = calculateCost(tokensIn, tokensOut, PRICING, searchCalls);
    return {
      text,
      searchResults,
      tokensIn,
      tokensOut,
      costUsd,
      latencyMs,
      model: this.model,
      raw: response,
    };
  }
}

interface AnthropicBlock {
  type: string;
  text?: string;
  citations?: Array<{ url?: string; title?: string }>;
  content?: Array<{ url?: string; title?: string }>;
}

function extractFromMessage(message: Anthropic.Message): {
  text: string;
  searchResults: SearchResult[];
  searchCalls: number;
} {
  const parts: string[] = [];
  const results: SearchResult[] = [];
  let searchCalls = 0;
  for (const block of message.content as unknown as AnthropicBlock[]) {
    if (block.type === 'text' && block.text) {
      parts.push(block.text);
      for (const c of block.citations ?? []) {
        if (c.url) results.push({ url: c.url, title: c.title });
      }
    }
    if (block.type === 'server_tool_use' || block.type === 'tool_use') {
      searchCalls += 1;
    }
    if (block.type === 'web_search_tool_result') {
      for (const r of block.content ?? []) {
        if (r.url) results.push({ url: r.url, title: r.title });
      }
    }
  }
  return { text: parts.join('\n').trim(), searchResults: results, searchCalls };
}
