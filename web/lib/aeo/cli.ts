/* eslint-disable no-console */
import { Command } from 'commander';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { buildProviders } from './providers/index';
import { loadOrInitConfig, parseCompetitorsArg } from './config';
import { suggestPrompts } from './prompt-suggest';
import { runQuery } from './query-runner';
import { computeScore } from './score';
import { suggestRecommendations } from './competitor-suggest';
import { generateLlmsTxt } from './artifacts/llms-txt';
import { generateRobotsPatch } from './artifacts/robots-patch';
import { generateSchemaJsonLd } from './artifacts/schema-jsonld';
import { generateEeatRecommendations } from './artifacts/eeat-recommendations';
import { prioritize } from './prioritizer';
import { scrapePage } from './scraper';
import {
  aeoDir,
  artifactsDir,
  loadConfig,
  loadLatestRun,
  loadPrompts,
  reportPath,
  saveConfig,
  savePrompts,
  saveRun,
  writeJson,
  writeText,
} from './storage';
import { buildAeoReportHtml, renderAeoPdf } from '../pdf/template-aeo';
import type { ProviderId } from './types';

const program = new Command();
program
  .name('aeo')
  .description('Seona AEO — Answer Engine Optimization Tracking & Reporting')
  .version('1.4.0');

program
  .command('suggest-prompts')
  .description('Generate 10 prompt candidates for a domain (LLM-suggested with fallback)')
  .argument('<domain>', 'Brand domain (e.g. bitsandbond.com)')
  .option('--dry-run', 'Use fixture-based provider (no API calls)', false)
  .option('--brand <name>', 'Override brand name')
  .option('--lang <lang>', 'Language (de|en)', 'de')
  .action(async (domain: string, opts: { dryRun?: boolean; brand?: string; lang?: 'de' | 'en' }) => {
    const config = await loadOrInitConfig(domain, {
      brandName: opts.brand,
      language: opts.lang,
    });
    const { providers } = await buildProviders({
      dryRun: opts.dryRun,
      enabled: ['openai'],
    });
    const prompts = await suggestPrompts(config, providers[0] ?? null, 10);
    console.log(JSON.stringify(prompts, null, 2));
    await savePrompts(domain, prompts);
    console.error(`Saved ${prompts.length} prompts → ${join(aeoDir(domain), 'prompts.json')}`);
  });

program
  .command('init-config')
  .description('Initialize or update brand config for a domain')
  .argument('<domain>', 'Brand domain')
  .option('--brand <name>', 'Brand name')
  .option('--lang <lang>', 'Language (de|en)', 'de')
  .option('--competitors <list>', 'Comma-separated competitor domains')
  .option('--logo <path>', 'Path or URL to brand logo')
  .option('--accent <color>', 'Hex color for accent', '#e05a33')
  .option('--industry <slug>', 'creator-management | webdesign-agency | saas | ecommerce | local-business | publisher | consulting | agency-general | other')
  .option('--description <text>', '1–2 sentences describing what the brand does')
  .option('--services <list>', 'Comma-separated list of main services')
  .option('--target-customer <text>', 'Description of the ideal customer')
  .option('--region <text>', 'Primary market/region', 'DACH')
  .option('--aliases <list>', 'Comma-separated alternate spellings of the brand name')
  .action(async (domain: string, opts: Record<string, string | undefined>) => {
    const competitors = parseCompetitorsArg(opts.competitors);
    const services = opts.services ? opts.services.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    const aliases = opts.aliases ? opts.aliases.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    const cfg = await loadOrInitConfig(domain, {
      brandName: opts.brand,
      language: (opts.lang as 'de' | 'en') ?? 'de',
      logoPath: opts.logo ?? null,
      accentColor: opts.accent,
      competitors,
      industry: opts.industry as never,
      description: opts.description,
      services,
      targetCustomer: opts.targetCustomer,
      region: opts.region,
      aliases,
    });
    await saveConfig(domain, cfg);
    console.log(JSON.stringify(cfg, null, 2));
  });

program
  .command('run')
  .description('Run AEO tracking against multi-LLM with web search')
  .argument('<domain>', 'Brand domain')
  .option('--dry-run', 'Use fixture-based providers (no API calls, ~0 cost)', false)
  .option('--samples <n>', 'Samples per prompt per provider', '3')
  .option('--max-spend <usd>', 'Hard spend cap in USD', '20')
  .option('--providers <list>', 'Comma-separated provider IDs (openai,anthropic,gemini)', 'openai,anthropic,gemini')
  .option('--competitors <list>', 'Comma-separated competitor domains (overrides config)')
  .action(async (domain: string, opts: Record<string, string | boolean | undefined>) => {
    const competitorsOverride = typeof opts.competitors === 'string' ? parseCompetitorsArg(opts.competitors) : undefined;
    let config = (await loadConfig(domain)) ?? (await loadOrInitConfig(domain));
    if (competitorsOverride && competitorsOverride.length > 0) {
      config = { ...config, competitors: competitorsOverride };
      await saveConfig(domain, config);
    }
    const enabledProviders = (opts.providers as string).split(',').map((s) => s.trim()) as ProviderId[];

    let prompts = await loadPrompts(domain);
    if (!prompts || prompts.length === 0) {
      console.error('No saved prompts. Run `aeo suggest-prompts` first or pass --prompts.');
      process.exit(1);
    }

    const { providers, skipped } = await buildProviders({
      dryRun: opts.dryRun === true,
      enabled: enabledProviders,
    });
    if (skipped.length > 0) {
      for (const s of skipped) console.error(`Provider ${s.id} skipped: ${s.reason}`);
    }
    if (providers.length === 0) {
      console.error('No usable providers. Aborting.');
      process.exit(1);
    }

    const samples = Number(opts.samples ?? 3);
    const maxSpend = Number(opts.maxSpend ?? 20);
    const startedAt = Date.now();

    const run = await runQuery({
      config,
      prompts,
      providers,
      samples,
      maxSpendUsd: maxSpend,
      dryRun: opts.dryRun === true,
      onProgress: (e) => {
        if (e.kind === 'call_done') {
          process.stderr.write(`  ✓ ${e.provider}/${e.promptId}/${e.sampleIndex} $${e.totalUsd.toFixed(4)}\n`);
        } else if (e.kind === 'call_failed') {
          process.stderr.write(`  ✗ ${e.provider}/${e.promptId}/${e.sampleIndex} ${e.error}\n`);
        } else if (e.kind === 'budget_exceeded') {
          process.stderr.write(`! Budget exceeded: $${e.totalUsd.toFixed(2)} / $${e.cap.toFixed(2)}\n`);
        }
      },
    });
    const path = await saveRun(domain, run);
    const elapsed = Date.now() - startedAt;
    console.error(`\nRun complete. Calls: ${run.calls.length}, Cost: $${run.totalCostUsd.toFixed(4)}, Time: ${(elapsed / 1000).toFixed(1)}s`);
    console.error(`Saved → ${path}`);
  });

program
  .command('score')
  .description('Compute AI Visibility Score for the latest run')
  .argument('<domain>', 'Brand domain')
  .action(async (domain: string) => {
    const run = await loadLatestRun(domain);
    if (!run) {
      console.error('No run found. Run `aeo run` first.');
      process.exit(1);
    }
    const score = computeScore(run);
    console.log(JSON.stringify(score, null, 2));
  });

program
  .command('suggest')
  .description('Competitor gap suggestions (scrapes sites + LLM analysis)')
  .argument('<domain>', 'Brand domain')
  .option('--dry-run', 'Use fixture provider (no API calls)', false)
  .action(async (domain: string, opts: { dryRun?: boolean }) => {
    const run = await loadLatestRun(domain);
    if (!run) {
      console.error('No run found.');
      process.exit(1);
    }
    const score = computeScore(run);
    const { providers } = await buildProviders({ dryRun: opts.dryRun, enabled: ['anthropic'] });
    const recs = await suggestRecommendations({
      config: run.config,
      score,
      provider: providers[0] ?? null,
    });
    await writeJson(join(aeoDir(domain), 'recommendations.json'), recs);
    console.log(JSON.stringify(recs, null, 2));
  });

program
  .command('artifacts')
  .description('Generate llms.txt, robots-patch, JSON-LD, E-E-A-T recommendations')
  .argument('<domain>', 'Brand domain')
  .option('--skip-scrape', 'Skip homepage scrape (use defaults)', false)
  .action(async (domain: string, opts: { skipScrape?: boolean }) => {
    const config = (await loadConfig(domain)) ?? (await loadOrInitConfig(domain));
    const dir = artifactsDir(domain);

    const homepage = opts.skipScrape ? null : await scrapePage(`https://${domain}`, { respectRobots: true });
    const llms = generateLlmsTxt({ config, homepage });
    await writeText(join(dir, 'llms.txt'), llms);

    let existingRobots = '';
    if (!opts.skipScrape) {
      try {
        const resp = await fetch(`https://${domain}/robots.txt`);
        if (resp.ok) existingRobots = await resp.text();
      } catch {}
    }
    const robots = generateRobotsPatch({ existing: existingRobots });
    await writeText(join(dir, 'robots-patch.diff'), robots.diff);
    await writeText(join(dir, 'robots-proposed.txt'), robots.fullProposed);

    const schema = generateSchemaJsonLd({
      config,
      description: homepage?.description,
    });
    await writeText(join(dir, 'schema.jsonld'), schema.combined);

    const eeat = generateEeatRecommendations(config);
    const eeatMd = eeat
      .map((r) => `### ${r.area}\n\n${r.recommendation}\n\n_Impact: ${r.impact} · Aufwand: ${r.effort}_`)
      .join('\n\n');
    await writeText(join(dir, 'eeat-recommendations.md'), `# E-E-A-T-Empfehlungen für ${config.brandName}\n\n${eeatMd}\n`);

    const summary = {
      llmsTxt: join(dir, 'llms.txt'),
      robotsPatch: join(dir, 'robots-patch.diff'),
      robotsProposed: join(dir, 'robots-proposed.txt'),
      robotsChanges: robots.changes,
      schemaJsonLd: join(dir, 'schema.jsonld'),
      eeat: join(dir, 'eeat-recommendations.md'),
    };
    await writeJson(join(dir, 'index.json'), summary);
    console.log(JSON.stringify(summary, null, 2));
  });

program
  .command('report')
  .description('Render the AEO HTML+PDF client report')
  .argument('<domain>', 'Brand domain')
  .option('--lang <lang>', 'Report language (de|en)', 'de')
  .option('--no-pdf', 'Skip PDF rendering (HTML only)')
  .option('--dry-run', 'Use fixture provider for suggest step if recommendations missing', false)
  .action(async (domain: string, opts: { lang?: 'de' | 'en'; pdf?: boolean; dryRun?: boolean }) => {
    const run = await loadLatestRun(domain);
    if (!run) {
      console.error('No run found.');
      process.exit(1);
    }
    const score = computeScore(run);
    const dir = artifactsDir(domain);

    const llmsTxt = (await fs.readFile(join(dir, 'llms.txt'), 'utf8').catch(() => '')) || '(noch nicht generiert)';
    const robotsDiff = (await fs.readFile(join(dir, 'robots-patch.diff'), 'utf8').catch(() => '')) || '';
    const robotsIndexRaw = await fs.readFile(join(dir, 'index.json'), 'utf8').catch(() => '{}');
    const robotsIndex = JSON.parse(robotsIndexRaw) as { robotsChanges?: string[] };
    const schemaJsonLd = (await fs.readFile(join(dir, 'schema.jsonld'), 'utf8').catch(() => '')) || '';

    let recs: Array<{ promptId: string; competitor: string; gapDescription: string; recommendations: string[] }> = [];
    const recsPath = join(aeoDir(domain), 'recommendations.json');
    try {
      const raw = await fs.readFile(recsPath, 'utf8');
      recs = JSON.parse(raw);
    } catch {}

    const eeat = generateEeatRecommendations(run.config);
    const actionItems = prioritize({
      config: run.config,
      score,
      recommendations: recs,
      eeat,
      llmsTxtMissing: llmsTxt === '(noch nicht generiert)',
      robotsPatchChanges: robotsIndex.robotsChanges ?? [],
    });

    const html = buildAeoReportHtml({
      run,
      score,
      config: run.config,
      actionItems,
      competitorGaps: recs,
      eeat,
      artifacts: {
        llmsTxt,
        robotsPatch: { diff: robotsDiff, changes: robotsIndex.robotsChanges ?? [] },
        schemaJsonLdCombined: schemaJsonLd,
      },
      language: opts.lang ?? run.config.language ?? 'de',
    });
    const htmlPath = reportPath(domain, 'html');
    await writeText(htmlPath, html);
    console.error(`HTML → ${htmlPath}`);

    if (opts.pdf !== false) {
      try {
        const buf = await renderAeoPdf({
          run,
          score,
          config: run.config,
          actionItems,
          competitorGaps: recs,
          eeat,
          artifacts: {
            llmsTxt,
            robotsPatch: { diff: robotsDiff, changes: robotsIndex.robotsChanges ?? [] },
            schemaJsonLdCombined: schemaJsonLd,
          },
          language: opts.lang ?? run.config.language ?? 'de',
        }, html);
        const pdfPath = reportPath(domain, 'pdf');
        await fs.writeFile(pdfPath, buf);
        console.error(`PDF → ${pdfPath}`);
      } catch (err) {
        console.error(`PDF rendering failed: ${(err as Error).message}`);
        console.error('HTML report is still available.');
      }
    }
    console.log(JSON.stringify({ html: htmlPath, score: score.overall, gap: score.gapPoints }, null, 2));
  });

program
  .command('audit')
  .description('Compose end-to-end: artifacts → suggest → report (assumes prompts saved & run done)')
  .argument('<domain>', 'Brand domain')
  .option('--lang <lang>', 'Report language', 'de')
  .option('--dry-run', 'Use fixtures for suggest step', false)
  .option('--no-pdf', 'Skip PDF rendering')
  .action(async (domain: string, opts: { lang?: 'de' | 'en'; pdf?: boolean; dryRun?: boolean }) => {
    const { execSync } = await import('node:child_process');
    const flag = opts.dryRun ? ' --dry-run' : '';
    const node = process.execPath;
    const cli = __filename;
    execSync(`"${node}" "${cli}" artifacts ${domain}`, { stdio: 'inherit' });
    try {
      execSync(`"${node}" "${cli}" suggest ${domain}${flag}`, { stdio: 'inherit' });
    } catch {
      console.error('Suggest step skipped.');
    }
    const pdfFlag = opts.pdf === false ? ' --no-pdf' : '';
    execSync(`"${node}" "${cli}" report ${domain} --lang ${opts.lang ?? 'de'}${pdfFlag}`, { stdio: 'inherit' });
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
