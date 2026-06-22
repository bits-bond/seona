import { z } from 'zod';

export const ProviderIdSchema = z.enum(['openai', 'anthropic', 'gemini']);
export type ProviderId = z.infer<typeof ProviderIdSchema>;

export const SeverityLevelSchema = z.enum(['critical', 'high', 'medium', 'low']);
export type SeverityLevel = z.infer<typeof SeverityLevelSchema>;

export const PromptSchema = z.object({
  id: z.string(),
  text: z.string(),
  rationale: z.string().optional(),
});
export type Prompt = z.infer<typeof PromptSchema>;

export const SearchResultSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
  snippet: z.string().optional(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

export const ProviderResponseSchema = z.object({
  text: z.string(),
  searchResults: z.array(SearchResultSchema),
  tokensIn: z.number(),
  tokensOut: z.number(),
  costUsd: z.number(),
  latencyMs: z.number(),
  model: z.string(),
  raw: z.unknown().optional(),
});
export type ProviderResponse = z.infer<typeof ProviderResponseSchema>;

export const CitationKindSchema = z.enum(['brand_mention', 'url_match', 'grounded_source']);
export type CitationKind = z.infer<typeof CitationKindSchema>;

export const CitationSchema = z.object({
  kind: CitationKindSchema,
  entity: z.string(),
  url: z.string().optional(),
  snippet: z.string().optional(),
});
export type Citation = z.infer<typeof CitationSchema>;

export const CallSchema = z.object({
  id: z.string(),
  promptId: z.string(),
  promptText: z.string(),
  provider: ProviderIdSchema,
  model: z.string(),
  sampleIndex: z.number(),
  response: ProviderResponseSchema,
  brandCitations: z.array(CitationSchema),
  competitorCitations: z.record(z.string(), z.array(CitationSchema)),
  timestamp: z.string(),
});
export type Call = z.infer<typeof CallSchema>;

export const IndustrySchema = z.enum([
  'creator-management',
  'webdesign-agency',
  'saas',
  'ecommerce',
  'local-business',
  'publisher',
  'consulting',
  'agency-general',
  'other',
]);
export type Industry = z.infer<typeof IndustrySchema>;

export const BrandConfigSchema = z.object({
  domain: z.string(),
  brandName: z.string(),
  aliases: z.array(z.string()).default([]),
  language: z.enum(['de', 'en']).default('de'),
  logoPath: z.string().nullable().default(null),
  accentColor: z.string().default('#e05a33'),
  industry: IndustrySchema.default('other'),
  description: z.string().default(''),
  services: z.array(z.string()).default([]),
  targetCustomer: z.string().default(''),
  region: z.string().default('DACH'),
  contact: z
    .object({
      email: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  competitors: z
    .array(
      z.object({
        domain: z.string(),
        brandName: z.string(),
        aliases: z.array(z.string()).default([]),
      }),
    )
    .default([]),
});
export type BrandConfig = z.infer<typeof BrandConfigSchema>;

export const RunSchema = z.object({
  id: z.string(),
  domain: z.string(),
  timestamp: z.string(),
  config: BrandConfigSchema,
  prompts: z.array(PromptSchema),
  calls: z.array(CallSchema),
  totalCostUsd: z.number(),
  totalLatencyMs: z.number(),
  providers: z.array(ProviderIdSchema),
  samplesPerProvider: z.number(),
  dryRun: z.boolean().default(false),
});
export type Run = z.infer<typeof RunSchema>;

export const PromptProviderRateSchema = z.object({
  promptId: z.string(),
  promptText: z.string(),
  provider: ProviderIdSchema,
  brandRate: z.number(),
  competitorRates: z.record(z.string(), z.number()),
  topCompetitor: z.string().optional(),
  gap: z.number(),
});
export type PromptProviderRate = z.infer<typeof PromptProviderRateSchema>;

export const ScoreSchema = z.object({
  overall: z.number(),
  brandCitationRate: z.number(),
  bestCompetitorRate: z.number(),
  gapPoints: z.number(),
  perProvider: z.record(ProviderIdSchema, z.number()),
  perPrompt: z.array(PromptProviderRateSchema),
  interpretation: z.string(),
});
export type Score = z.infer<typeof ScoreSchema>;

export const SuggestRecommendationSchema = z.object({
  promptId: z.string(),
  competitor: z.string(),
  gapDescription: z.string(),
  recommendations: z.array(z.string()),
});
export type SuggestRecommendation = z.infer<typeof SuggestRecommendationSchema>;

export const ActionItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: SeverityLevelSchema,
  impactScore: z.number(),
  effortScore: z.number(),
  source: z.string(),
});
export type ActionItem = z.infer<typeof ActionItemSchema>;

export interface LLMProvider {
  id: ProviderId;
  model: string;
  query(prompt: string): Promise<ProviderResponse>;
}
