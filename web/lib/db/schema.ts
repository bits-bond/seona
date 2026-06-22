import { pgTable, uuid, varchar, integer, real, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  url: varchar('url', { length: 2048 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // AEO brand context (optional — populated when a project is used for AEO)
  aeoIndustry: varchar('aeo_industry', { length: 40 }),
  aeoDescription: text('aeo_description'),
  aeoServices: jsonb('aeo_services').$type<string[]>(),
  aeoTargetCustomer: text('aeo_target_customer'),
  aeoRegion: varchar('aeo_region', { length: 80 }),
  aeoAliases: jsonb('aeo_aliases').$type<string[]>(),
  aeoCompetitors: jsonb('aeo_competitors').$type<Array<{ domain: string; brandName: string; aliases: string[] }>>(),
  aeoAccentColor: varchar('aeo_accent_color', { length: 16 }),
  aeoLogoPath: varchar('aeo_logo_path', { length: 1024 }),
  aeoLanguage: varchar('aeo_language', { length: 5 }),
});

export const audits = pgTable('audits', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  overallScore: integer('overall_score'),
  businessType: varchar('business_type', { length: 100 }),
  pagesCrawled: integer('pages_crawled'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  fullReportMd: text('full_report_md'),
  actionPlanMd: text('action_plan_md'),
  errorMessage: text('error_message'),
  language: varchar('language', { length: 5 }).notNull().default('en'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditCategories = pgTable('audit_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  auditId: uuid('audit_id').notNull().references(() => audits.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 20 }).notNull(),
  score: integer('score').notNull(),
  weight: integer('weight').notNull(),
  weightedScore: real('weighted_score').notNull(),
  findingsJson: jsonb('findings_json'),
});

export const auditIssues = pgTable('audit_issues', {
  id: uuid('id').primaryKey().defaultRandom(),
  auditId: uuid('audit_id').notNull().references(() => audits.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 20 }).notNull(),
  severity: varchar('severity', { length: 10 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  impact: text('impact'),
  recommendation: text('recommendation'),
  orderIndex: integer('order_index').notNull().default(0),
});

export const auditSubReports = pgTable('audit_sub_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  auditId: uuid('audit_id').notNull().references(() => audits.id, { onDelete: 'cascade' }),
  slug: varchar('slug', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  source: varchar('source', { length: 20 }).notNull().default('file'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── AEO tables ──────────────────────────────────────────────────────────

export const aeoRuns = pgTable('aeo_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  overallScore: integer('overall_score'),
  brandCitationRate: real('brand_citation_rate'),
  bestCompetitorRate: real('best_competitor_rate'),
  gapPoints: real('gap_points'),
  totalCostUsd: real('total_cost_usd'),
  totalLatencyMs: integer('total_latency_ms'),
  providers: jsonb('providers').$type<string[]>(),
  samplesPerProvider: integer('samples_per_provider'),
  dryRun: integer('dry_run').notNull().default(0),
  runFilePath: varchar('run_file_path', { length: 1024 }),
  interpretation: text('interpretation'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aeoPrompts = pgTable('aeo_prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  promptHash: varchar('prompt_hash', { length: 32 }).notNull(),
  text: text('text').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  isApproved: integer('is_approved').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const aeoActionItems = pgTable('aeo_action_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  runId: uuid('run_id').references(() => aeoRuns.id, { onDelete: 'cascade' }),
  itemKey: varchar('item_key', { length: 100 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  severity: varchar('severity', { length: 10 }).notNull(),
  impactScore: integer('impact_score'),
  effortScore: integer('effort_score'),
  source: varchar('source', { length: 40 }),
  orderIndex: integer('order_index').notNull().default(0),
});

export const aeoRecommendations = pgTable('aeo_recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  runId: uuid('run_id').references(() => aeoRuns.id, { onDelete: 'cascade' }),
  promptHash: varchar('prompt_hash', { length: 32 }),
  competitor: varchar('competitor', { length: 200 }),
  gapDescription: text('gap_description'),
  recommendations: jsonb('recommendations').$type<string[]>(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  audits: many(audits),
  aeoRuns: many(aeoRuns),
  aeoPrompts: many(aeoPrompts),
}));

export const aeoRunsRelations = relations(aeoRuns, ({ one, many }) => ({
  project: one(projects, { fields: [aeoRuns.projectId], references: [projects.id] }),
  actionItems: many(aeoActionItems),
  recommendations: many(aeoRecommendations),
}));

export const aeoPromptsRelations = relations(aeoPrompts, ({ one }) => ({
  project: one(projects, { fields: [aeoPrompts.projectId], references: [projects.id] }),
}));

export const aeoActionItemsRelations = relations(aeoActionItems, ({ one }) => ({
  project: one(projects, { fields: [aeoActionItems.projectId], references: [projects.id] }),
  run: one(aeoRuns, { fields: [aeoActionItems.runId], references: [aeoRuns.id] }),
}));

export const aeoRecommendationsRelations = relations(aeoRecommendations, ({ one }) => ({
  project: one(projects, { fields: [aeoRecommendations.projectId], references: [projects.id] }),
  run: one(aeoRuns, { fields: [aeoRecommendations.runId], references: [aeoRuns.id] }),
}));

export const auditsRelations = relations(audits, ({ one, many }) => ({
  project: one(projects, {
    fields: [audits.projectId],
    references: [projects.id],
  }),
  categories: many(auditCategories),
  issues: many(auditIssues),
  subReports: many(auditSubReports),
}));

export const auditCategoriesRelations = relations(auditCategories, ({ one }) => ({
  audit: one(audits, {
    fields: [auditCategories.auditId],
    references: [audits.id],
  }),
}));

export const auditIssuesRelations = relations(auditIssues, ({ one }) => ({
  audit: one(audits, {
    fields: [auditIssues.auditId],
    references: [audits.id],
  }),
}));

export const auditSubReportsRelations = relations(auditSubReports, ({ one }) => ({
  audit: one(audits, {
    fields: [auditSubReports.auditId],
    references: [audits.id],
  }),
}));
