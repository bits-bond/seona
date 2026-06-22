import { spawn, type ChildProcess } from 'node:child_process';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseFullReport, parseActionPlan, validateParsedReport } from './parser';
import { readSubReportFiles } from './sub-report-files';
import type { AuditProgress } from './types';

/** Persist maps across HMR reloads in Next.js dev mode via globalThis */
const globalForRunner = globalThis as typeof globalThis & {
  __auditActiveProcesses?: Map<string, ChildProcess>;
  __auditProgressMap?: Map<string, AuditProgress>;
  __auditRunnerVersion?: number;
};

/** Map of active audit processes keyed by auditId */
const activeProcesses = globalForRunner.__auditActiveProcesses ??= new Map<string, ChildProcess>();

/** Map of progress data keyed by auditId for SSE polling */
const auditProgressMap = globalForRunner.__auditProgressMap ??= new Map<string, AuditProgress>();

/**
 * On HMR reload, clear stale process entries. When this module recompiles,
 * event listeners (close, error, data) on old ChildProcess refs are lost,
 * making those entries unmanageable zombies. Clear them so new runs can start.
 */
const MODULE_VERSION = Date.now();
if (globalForRunner.__auditRunnerVersion && globalForRunner.__auditRunnerVersion !== MODULE_VERSION) {
  if (activeProcesses.size > 0) {
    console.error(`[audit-runner] HMR detected, clearing ${activeProcesses.size} stale process entries`);
    activeProcesses.clear();
  }
}
globalForRunner.__auditRunnerVersion = MODULE_VERSION;

/** Project root is one level up from the web/ directory */
const PROJECT_ROOT = path.resolve(process.cwd(), '..');

/** Progress stage detection patterns */
const PROGRESS_STAGES: { pattern: RegExp; percentage: number; stage: string }[] = [
  { pattern: /fetching\s+homepage/i, percentage: 10, stage: 'Fetching homepage' },
  { pattern: /detect.*business\s*type/i, percentage: 15, stage: 'Detecting business type' },
  { pattern: /launch.*subagent/i, percentage: 20, stage: 'Launching subagents' },
  { pattern: /technical\s*seo/i, percentage: 30, stage: 'Running technical SEO audit' },
  { pattern: /content\s*quality/i, percentage: 45, stage: 'Running content quality audit' },
  { pattern: /schema/i, percentage: 55, stage: 'Running schema audit' },
  { pattern: /performance/i, percentage: 65, stage: 'Running performance audit' },
  { pattern: /generating\s*report/i, percentage: 80, stage: 'Generating report' },
  { pattern: /action.?plan/i, percentage: 90, stage: 'Writing action plan' },
];

/**
 * Check if the `claude` CLI is available on the system.
 */
export function isClaudeCliAvailable(): boolean {
  try {
    execSync('which claude', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current progress for an audit.
 */
export function getAuditProgress(auditId: string): AuditProgress | null {
  return auditProgressMap.get(auditId) ?? null;
}

/**
 * Check if an audit process is currently running.
 * Cleans up stale entries where the process has exited but wasn't removed
 * (can happen when HMR recompiles this module and event listeners are lost).
 */
export function isAuditRunning(auditId: string): boolean {
  const proc = activeProcesses.get(auditId);
  if (!proc) return false;

  // Process exited but close handler was lost (HMR scenario)
  if (proc.exitCode !== null || proc.killed) {
    console.error(`[audit-runner] Cleaning up stale process for ${auditId} (exitCode: ${proc.exitCode})`);
    activeProcesses.delete(auditId);
    return false;
  }

  // Verify the OS process is actually alive (handles edge cases where
  // exitCode hasn't been set yet but the process is gone)
  if (proc.pid) {
    try {
      process.kill(proc.pid, 0); // signal 0 = just check if alive
    } catch {
      console.error(`[audit-runner] Process ${proc.pid} for ${auditId} is dead, cleaning up`);
      activeProcesses.delete(auditId);
      return false;
    }
  }

  return true;
}

/**
 * Extract domain from URL for output directory path.
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/https?:\/\//, '').replace(/\/.*/, '').replace(/^www\./, '');
  }
}

/**
 * Find the output directory for an audit.
 * The CLI may save to a different domain than the input URL (e.g. redirects, typos).
 * Strategy: try exact domain first, then find the most recently modified dir in output/.
 */
function findOutputDir(domain: string, auditStartTime: Date): string {
  const exactDir = path.join(PROJECT_ROOT, 'output', domain);
  if (existsSync(path.join(exactDir, 'FULL-AUDIT-REPORT.md'))) {
    return exactDir;
  }

  // Scan output/ for directories modified after the audit started
  const outputRoot = path.join(PROJECT_ROOT, 'output');
  if (!existsSync(outputRoot)) return exactDir;

  try {
    const dirs = readdirSync(outputRoot, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => {
        const dirPath = path.join(outputRoot, d.name);
        const reportPath = path.join(dirPath, 'FULL-AUDIT-REPORT.md');
        if (!existsSync(reportPath)) return null;
        const mtime = statSync(reportPath).mtime;
        return { name: d.name, dirPath, mtime };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null && d.mtime >= auditStartTime)
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (dirs.length > 0) {
      console.error(`[audit-runner] Output dir mismatch: expected ${domain}, found ${dirs[0].name}`);
      return dirs[0].dirPath;
    }
  } catch {
    // fallback to exact match
  }

  return exactDir;
}

/**
 * Detect progress stage from a CLI output line.
 */
function detectProgress(line: string, currentPercentage: number): AuditProgress | null {
  for (const { pattern, percentage, stage } of PROGRESS_STAGES) {
    if (pattern.test(line) && percentage > currentPercentage) {
      return {
        percentage,
        stage,
        message: line.trim(),
        timestamp: new Date(),
      };
    }
  }
  return null;
}

/**
 * Start an audit by spawning the Claude CLI process.
 * This function returns immediately — the audit runs asynchronously.
 */
export async function startAudit(
  auditId: string,
  url: string,
  baseApiUrl: string,
  language: string = 'en',
): Promise<void> {
  if (!isClaudeCliAvailable()) {
    await updateAuditStatus(baseApiUrl, auditId, 'failed', {
      errorMessage: 'Claude CLI is not installed. Install it with: npm install -g @anthropic-ai/claude-code',
    });
    return;
  }

  if (isAuditRunning(auditId)) {
    return;
  }

  const domain = extractDomain(url);
  let prompt = `Run /seo-audit ${url}. Save all output files to output/${domain}/

CRITICAL FORMAT REQUIREMENTS for FULL-AUDIT-REPORT.md:
1. The overall score MUST appear as exactly: ### Overall SEO Health Score: N/100
2. The category table MUST use these EXACT column headers and category names:
   | Category | Weight | Score | Weighted |
   | Technical SEO | 25% | N/100 | N.NN |
   | Content Quality | 25% | N/100 | N.NN |
   | On-Page SEO | 20% | N/100 | N.NN |
   | Schema / Structured Data | 10% | N/100 | N.NN |
   | Performance (CWV) | 10% | N/100 | N.NN |
   | Images | 5% | N/100 | N.NN |
   | AI Search Readiness | 5% | N/100 | N.NN |
3. Weighted scores use dot decimals (7.5 not 7,5). Score format is N/100 (no spaces).

CRITICAL FORMAT REQUIREMENTS for ACTION-PLAN.md:
1. Severity section headers MUST be: ## CRITICAL, ## HIGH, ## MEDIUM, ## LOW
2. Issue titles MUST use: ### N. Title (sequential numbering, no letter prefixes)`;

  if (language === 'de') {
    prompt += `

Write the entire audit report and action plan in German (Deutsch). All findings, descriptions, recommendations must be in German. Keep technical terms (robots.txt, JSON-LD, CWV) in their original form.
IMPORTANT: Even though content is in German, these structural tokens MUST stay in English exactly as specified above:
- Score label: "### Overall SEO Health Score: N/100"
- Category names: Technical SEO, Content Quality, On-Page SEO, Schema / Structured Data, Performance (CWV), Images, AI Search Readiness
- Severity headers: ## CRITICAL, ## HIGH, ## MEDIUM, ## LOW
- Use dot decimals (7.5 not 7,5)`;
  }

  // Update status to running
  await updateAuditStatus(baseApiUrl, auditId, 'running', {
    startedAt: new Date().toISOString(),
  });

  const auditStartTime = new Date();

  // Set initial progress
  auditProgressMap.set(auditId, {
    percentage: 5,
    stage: 'Starting audit',
    message: `Starting SEO audit for ${url}`,
    timestamp: auditStartTime,
  });

  // Strip CLAUDECODE env var to allow spawning claude inside a dev server
  // that may itself be running inside a Claude Code session
  const cleanEnv = { ...process.env };
  delete cleanEnv.CLAUDECODE;

  // Windows: npm installs `claude` as `claude.cmd`. Node spawn can't execute
  // .cmd files directly since CVE-2024-27980; requires shell:true. We pipe
  // the prompt via stdin to avoid cmd.exe argument-quoting hazards.
  const isWindows = process.platform === 'win32';
  const claudeBin = isWindows ? 'claude.cmd' : 'claude';

  const child = spawn(claudeBin, [
    '--print',
    '--dangerously-skip-permissions',
  ], {
    cwd: PROJECT_ROOT,
    env: cleanEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: isWindows,
  });

  child.stdin?.write(prompt);
  child.stdin?.end();

  activeProcesses.set(auditId, child);
  console.error(`[audit-runner] Spawned claude CLI for ${auditId}, PID: ${child.pid}`);
  let currentPercentage = 5;
  let stdoutBuffer = '';
  let stderrBuffer = '';

  child.stdout?.on('data', (data: Buffer) => {
    const text = data.toString();
    stdoutBuffer += text;

    // Process each line for progress detection
    const lines = text.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;

      const progress = detectProgress(line, currentPercentage);
      if (progress) {
        currentPercentage = progress.percentage;
        auditProgressMap.set(auditId, progress);
      } else {
        // Update message even without stage change
        auditProgressMap.set(auditId, {
          percentage: currentPercentage,
          stage: auditProgressMap.get(auditId)?.stage ?? 'Processing',
          message: line.trim().substring(0, 200),
          timestamp: new Date(),
        });
      }
    }
  });

  child.stderr?.on('data', (data: Buffer) => {
    const text = data.toString();
    stderrBuffer += text;
    console.error(`[audit-runner] stderr (${auditId}): ${text.trim().substring(0, 500)}`);
  });

  child.on('close', async (code) => {
    console.error(`[audit-runner] Process closed for ${auditId} with code ${code}, stderr length: ${stderrBuffer.length}, stderr: ${stderrBuffer.substring(0, 500)}`);
    activeProcesses.delete(auditId);

    if (code !== 0) {
      auditProgressMap.set(auditId, {
        percentage: 100,
        stage: 'Failed',
        message: stderrBuffer || `Process exited with code ${code}`,
        timestamp: new Date(),
      });

      await updateAuditStatus(baseApiUrl, auditId, 'failed', {
        errorMessage: stderrBuffer || `Claude CLI process exited with code ${code}`,
      });
      return;
    }

    // Process completed — parse output files
    auditProgressMap.set(auditId, {
      percentage: 95,
      stage: 'Parsing results',
      message: 'Parsing audit report and action plan',
      timestamp: new Date(),
    });

    try {
      const outputDir = findOutputDir(domain, auditStartTime);
      console.error(`[audit-runner] Looking for output in: ${outputDir}`);
      const reportPath = path.join(outputDir, 'FULL-AUDIT-REPORT.md');
      const actionPlanPath = path.join(outputDir, 'ACTION-PLAN.md');

      let parsedReport = null;
      let parsedActionPlan = null;

      if (existsSync(reportPath)) {
        const reportMd = readFileSync(reportPath, 'utf-8');
        parsedReport = parseFullReport(reportMd);
        const validation = validateParsedReport(parsedReport);
        if (!validation.valid) {
          console.warn(`[audit-runner] Parse validation warnings for ${auditId}:`, validation.warnings);
        }
        console.error(`[audit-runner] Parsed report: score=${parsedReport.overallScore}, categories=${parsedReport.categories.length}, businessType=${parsedReport.businessType}`);
      }

      if (existsSync(actionPlanPath)) {
        const actionPlanMd = readFileSync(actionPlanPath, 'utf-8');
        parsedActionPlan = parseActionPlan(actionPlanMd);
        console.error(`[audit-runner] Parsed action plan: ${parsedActionPlan.issues.length} issues`);
      }

      // Store audit fields via API
      const updateData: Record<string, unknown> = {
        status: 'completed',
        completedAt: new Date().toISOString(),
      };

      if (parsedReport) {
        updateData.overallScore = parsedReport.overallScore;
        updateData.businessType = parsedReport.businessType;
        updateData.pagesCrawled = parsedReport.pagesCrawled;
        updateData.fullReportMd = parsedReport.fullReportMd;
      }

      if (parsedActionPlan) {
        updateData.actionPlanMd = parsedActionPlan.actionPlanMd;
      }

      await updateAuditStatus(baseApiUrl, auditId, 'completed', updateData);

      // Save categories and issues via separate API calls
      if (parsedReport?.categories?.length) {
        await fetch(`${baseApiUrl}/api/audits/${auditId}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories: parsedReport.categories }),
        });
      }

      if (parsedActionPlan?.issues?.length) {
        await fetch(`${baseApiUrl}/api/audits/${auditId}/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issues: parsedActionPlan.issues }),
        });
      }

      // Save sub-audit detail files (technical-seo.md, schema-audit.md, etc.)
      const subReports = readSubReportFiles(outputDir, language);
      if (subReports.length > 0) {
        console.error(`[audit-runner] Saving ${subReports.length} sub-reports for ${auditId}`);
        await fetch(`${baseApiUrl}/api/audits/${auditId}/sub-reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subReports }),
        });
      }

      auditProgressMap.set(auditId, {
        percentage: 100,
        stage: 'Complete',
        message: `Audit complete. Score: ${parsedReport?.overallScore ?? 'N/A'}/100`,
        timestamp: new Date(),
      });
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      await updateAuditStatus(baseApiUrl, auditId, 'failed', {
        errorMessage: `Failed to parse audit results: ${errorMsg}`,
      });

      auditProgressMap.set(auditId, {
        percentage: 100,
        stage: 'Failed',
        message: `Parse error: ${errorMsg}`,
        timestamp: new Date(),
      });
    }
  });

  child.on('error', async (error) => {
    console.error(`[audit-runner] Process error for ${auditId}:`, error.message);
    activeProcesses.delete(auditId);

    auditProgressMap.set(auditId, {
      percentage: 100,
      stage: 'Failed',
      message: error.message,
      timestamp: new Date(),
    });

    await updateAuditStatus(baseApiUrl, auditId, 'failed', {
      errorMessage: `Failed to spawn Claude CLI: ${error.message}`,
    });
  });
}

/**
 * Cancel a running audit.
 */
export function cancelAudit(auditId: string): boolean {
  const process = activeProcesses.get(auditId);
  if (process) {
    process.kill('SIGTERM');
    activeProcesses.delete(auditId);
    auditProgressMap.delete(auditId);
    return true;
  }
  return false;
}

/**
 * Update audit status in the database via API.
 */
async function updateAuditStatus(
  baseApiUrl: string,
  auditId: string,
  status: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  try {
    await fetch(`${baseApiUrl}/api/audits/${auditId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...data }),
    });
  } catch (error) {
    console.error(`Failed to update audit ${auditId} status:`, error);
  }
}
