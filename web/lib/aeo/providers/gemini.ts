import { BaseProvider, calculateCost, type ProviderPricing } from './base';
import type { ProviderId, ProviderResponse, SearchResult } from '../types';

const DEFAULT_MODEL = 'gemini-2.0-flash';
const PRICING: ProviderPricing = {
  inputPerMillion: 0.1,
  outputPerMillion: 0.4,
  searchCallUsd: 0.0,
};

interface GenAIInstance {
  models: {
    generateContent: (args: {
      model: string;
      contents: string;
      config?: { tools?: unknown[] };
    }) => Promise<GeminiResponse>;
  };
}

interface GeminiResponse {
  text?: string;
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
      searchEntryPoint?: unknown;
    };
  }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

export class GeminiProvider extends BaseProvider {
  readonly id: ProviderId = 'gemini';
  readonly model: string;
  private client: GenAIInstance | null = null;
  private apiKey: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  private async getClient(): Promise<GenAIInstance> {
    if (this.client) return this.client;
    const mod = (await import('@google/genai')) as unknown as {
      GoogleGenAI: new (args: { apiKey: string }) => GenAIInstance;
    };
    this.client = new mod.GoogleGenAI({ apiKey: this.apiKey });
    return this.client;
  }

  async query(prompt: string): Promise<ProviderResponse> {
    const start = Date.now();
    const client = await this.getClient();
    let payload: GeminiResponse;
    try {
      payload = await client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
    } catch (err) {
      throw new Error(`Gemini query failed: ${(err as Error).message}`);
    }
    const latencyMs = Date.now() - start;
    const { text, searchResults, searchCalls } = extractFromGemini(payload);
    const tokensIn = payload.usageMetadata?.promptTokenCount ?? 0;
    const tokensOut = payload.usageMetadata?.candidatesTokenCount ?? 0;
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

function extractFromGemini(payload: GeminiResponse): {
  text: string;
  searchResults: SearchResult[];
  searchCalls: number;
} {
  if (payload.text) {
    const cand = payload.candidates?.[0];
    const results: SearchResult[] = [];
    for (const chunk of cand?.groundingMetadata?.groundingChunks ?? []) {
      if (chunk.web?.uri) results.push({ url: chunk.web.uri, title: chunk.web.title });
    }
    return { text: payload.text, searchResults: results, searchCalls: cand?.groundingMetadata ? 1 : 0 };
  }
  const cand = payload.candidates?.[0];
  const parts: string[] = [];
  for (const p of cand?.content?.parts ?? []) {
    if (p.text) parts.push(p.text);
  }
  const results: SearchResult[] = [];
  for (const chunk of cand?.groundingMetadata?.groundingChunks ?? []) {
    if (chunk.web?.uri) results.push({ url: chunk.web.uri, title: chunk.web.title });
  }
  return {
    text: parts.join('\n').trim(),
    searchResults: results,
    searchCalls: cand?.groundingMetadata ? 1 : 0,
  };
}
