import OpenAI from 'openai';
import { BaseProvider, calculateCost, type ProviderPricing } from './base';
import type { ProviderId, ProviderResponse, SearchResult } from '../types';

const DEFAULT_MODEL = 'gpt-4o-mini';
const PRICING: ProviderPricing = {
  inputPerMillion: 0.15,
  outputPerMillion: 0.6,
  searchCallUsd: 0.025,
};

interface ResponsesOutputItem {
  type: string;
  content?: Array<{ type: string; text?: string; annotations?: Array<{ url?: string; title?: string }> }>;
}

interface ResponsesPayload {
  output?: ResponsesOutputItem[];
  output_text?: string;
  usage?: { input_tokens?: number; output_tokens?: number };
}

export class OpenAIProvider extends BaseProvider {
  readonly id: ProviderId = 'openai';
  readonly model: string;
  private client: OpenAI;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    super();
    this.model = model;
    this.client = new OpenAI({ apiKey });
  }

  async query(prompt: string): Promise<ProviderResponse> {
    const start = Date.now();
    let payload: ResponsesPayload;
    try {
      // Responses API with web_search tool (preview).
      // Fallback handled at runtime if the API rejects.
      const anyClient = this.client as unknown as { responses?: { create: (args: unknown) => Promise<ResponsesPayload> } };
      if (anyClient.responses?.create) {
        payload = await anyClient.responses.create({
          model: this.model,
          input: prompt,
          tools: [{ type: 'web_search' }],
        });
      } else {
        const chat = await this.client.chat.completions.create({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
        });
        payload = {
          output_text: chat.choices[0]?.message?.content ?? '',
          usage: {
            input_tokens: chat.usage?.prompt_tokens ?? 0,
            output_tokens: chat.usage?.completion_tokens ?? 0,
          },
        };
      }
    } catch (err) {
      throw new Error(`OpenAI query failed: ${(err as Error).message}`);
    }
    const latencyMs = Date.now() - start;
    const { text, searchResults, searchCalls } = extractFromResponses(payload);
    const tokensIn = payload.usage?.input_tokens ?? 0;
    const tokensOut = payload.usage?.output_tokens ?? 0;
    const costUsd = calculateCost(tokensIn, tokensOut, PRICING, searchCalls);
    return {
      text,
      searchResults,
      tokensIn,
      tokensOut,
      costUsd,
      latencyMs,
      model: this.model,
      raw: payload,
    };
  }
}

function extractFromResponses(payload: ResponsesPayload): {
  text: string;
  searchResults: SearchResult[];
  searchCalls: number;
} {
  if (payload.output_text && (!payload.output || payload.output.length === 0)) {
    return { text: payload.output_text, searchResults: [], searchCalls: 0 };
  }
  const parts: string[] = [];
  const results: SearchResult[] = [];
  let searchCalls = 0;
  for (const item of payload.output ?? []) {
    if (item.type === 'web_search_call' || item.type === 'tool_use') {
      searchCalls += 1;
    }
    for (const block of item.content ?? []) {
      if (block.type === 'output_text' || block.type === 'text') {
        if (block.text) parts.push(block.text);
        for (const ann of block.annotations ?? []) {
          if (ann.url) results.push({ url: ann.url, title: ann.title });
        }
      }
    }
  }
  return {
    text: parts.join('\n').trim() || (payload.output_text ?? ''),
    searchResults: results,
    searchCalls,
  };
}
