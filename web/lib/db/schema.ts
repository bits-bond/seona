import { pgTable, uuid, varchar, integer, real, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  url: varchar('url', { length: 2048 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  audits: many(audits),
}));

export const auditsRelations = relations(audits, ({ one, many }) => ({
  project: one(projects, {
    fields: [audits.projectId],
    references: [projects.id],
  }),
  categories: many(auditCategories),
  issues: many(auditIssues),
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
