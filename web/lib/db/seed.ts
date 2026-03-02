import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { projects, audits, auditCategories, auditIssues } from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/claude_seo';
const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log('Seeding database...');

  // Read markdown files if they exist
  const outputDir = path.resolve(__dirname, '../../../output/watchmen.io');
  let fullReportMd: string | null = null;
  let actionPlanMd: string | null = null;

  try {
    fullReportMd = fs.readFileSync(path.join(outputDir, 'FULL-AUDIT-REPORT.md'), 'utf-8');
    console.log('Loaded FULL-AUDIT-REPORT.md');
  } catch {
    console.log('FULL-AUDIT-REPORT.md not found, using placeholder');
    fullReportMd = '# Full SEO Audit Report - watchmen.io\n\nAudit completed with overall score of 34/100.';
  }

  try {
    actionPlanMd = fs.readFileSync(path.join(outputDir, 'ACTION-PLAN.md'), 'utf-8');
    console.log('Loaded ACTION-PLAN.md');
  } catch {
    console.log('ACTION-PLAN.md not found, using placeholder');
    actionPlanMd = '# SEO Action Plan - watchmen.io\n\nPrioritized action items for improving SEO score.';
  }

  // Create project
  const [project] = await db.insert(projects).values({
    name: 'watchmen.io',
    url: 'https://watchmen.io',
  }).returning();
  console.log(`Created project: ${project.name} (${project.id})`);

  // Create audit
  const [audit] = await db.insert(audits).values({
    projectId: project.id,
    status: 'completed',
    overallScore: 34,
    businessType: 'Cybersecurity Consulting',
    pagesCrawled: 4,
    startedAt: new Date(Date.now() - 120000), // 2 minutes ago
    completedAt: new Date(),
    fullReportMd,
    actionPlanMd,
  }).returning();
  console.log(`Created audit: ${audit.id} (score: ${audit.overallScore})`);

  // Create categories
  const categoryData = [
    { category: 'technical', score: 52, weight: 25 },
    { category: 'content', score: 35, weight: 25 },
    { category: 'on_page', score: 35, weight: 20 },
    { category: 'schema', score: 0, weight: 10 },
    { category: 'performance', score: 50, weight: 10 },
    { category: 'images', score: 35, weight: 5 },
    { category: 'ai_readiness', score: 15, weight: 5 },
  ];

  await db.insert(auditCategories).values(
    categoryData.map((cat) => ({
      auditId: audit.id,
      category: cat.category,
      score: cat.score,
      weight: cat.weight,
      weightedScore: (cat.score * cat.weight) / 100,
    }))
  );
  console.log(`Created ${categoryData.length} audit categories`);

  // Create issues (top 10 from watchmen.io audit)
  const issueData = [
    {
      category: 'schema',
      severity: 'critical',
      title: 'Zero structured data markup detected',
      description: 'No JSON-LD, microdata, or RDFa structured data found on any page across the entire site.',
      impact: 'Missing out on rich results, knowledge panels, and enhanced SERP features.',
      recommendation: 'Implement Organization, WebSite, BreadcrumbList, and JobPosting schemas as JSON-LD.',
    },
    {
      category: 'technical',
      severity: 'critical',
      title: 'Missing XML sitemap',
      description: 'No XML sitemap found at /sitemap.xml or referenced in robots.txt.',
      impact: 'Search engines cannot efficiently discover and crawl all pages.',
      recommendation: 'Generate and submit an XML sitemap with all indexable pages.',
    },
    {
      category: 'on_page',
      severity: 'critical',
      title: 'Missing meta descriptions on all pages',
      description: 'No meta description tags found on any of the 4 pages analyzed.',
      impact: 'Google will auto-generate snippets which may not represent the page well.',
      recommendation: 'Add unique, compelling meta descriptions (150-160 chars) to every page.',
    },
    {
      category: 'technical',
      severity: 'high',
      title: 'No canonical tags implemented',
      description: 'Canonical link elements are missing from all pages.',
      impact: 'Risk of duplicate content issues and diluted ranking signals.',
      recommendation: 'Add self-referencing canonical tags to all pages.',
    },
    {
      category: 'content',
      severity: 'high',
      title: 'Thin content on key pages',
      description: 'Homepage and join page have minimal text content relative to their importance.',
      impact: 'Insufficient content signals for search engines to understand page topics.',
      recommendation: 'Expand content with relevant keywords, service descriptions, and value propositions.',
    },
    {
      category: 'ai_readiness',
      severity: 'high',
      title: 'No AI crawler access configuration',
      description: 'robots.txt does not address AI crawlers (GPTBot, ClaudeBot, PerplexityBot).',
      impact: 'No control over AI training data usage and missed AI search citation opportunities.',
      recommendation: 'Configure robots.txt for AI crawlers and create an llms.txt file.',
    },
    {
      category: 'performance',
      severity: 'medium',
      title: 'Large unoptimized images',
      description: 'Several images served without modern formats (WebP/AVIF) or proper sizing.',
      impact: 'Slower page loads affecting Core Web Vitals LCP scores.',
      recommendation: 'Convert images to WebP/AVIF, implement responsive srcset, and add lazy loading.',
    },
    {
      category: 'images',
      severity: 'medium',
      title: 'Missing alt text on images',
      description: 'Multiple images lack descriptive alt text attributes.',
      impact: 'Reduced image search visibility and accessibility compliance issues.',
      recommendation: 'Add descriptive, keyword-relevant alt text to all meaningful images.',
    },
    {
      category: 'on_page',
      severity: 'medium',
      title: 'Empty Open Graph tags on subpages',
      description: 'Join and Privacy pages have empty og:title, og:description, og:type, and og:url tags.',
      impact: 'Poor social sharing appearance and reduced click-through from social platforms.',
      recommendation: 'Populate all Open Graph tags with accurate, page-specific content.',
    },
    {
      category: 'content',
      severity: 'low',
      title: 'No internal linking strategy',
      description: 'Minimal cross-linking between pages; no contextual internal links in content.',
      impact: 'Poor link equity distribution and reduced crawl efficiency.',
      recommendation: 'Implement strategic internal links between related pages and content sections.',
    },
  ];

  await db.insert(auditIssues).values(
    issueData.map((issue, index) => ({
      auditId: audit.id,
      category: issue.category,
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      impact: issue.impact,
      recommendation: issue.recommendation,
      orderIndex: index,
    }))
  );
  console.log(`Created ${issueData.length} audit issues`);

  console.log('Seed complete!');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
