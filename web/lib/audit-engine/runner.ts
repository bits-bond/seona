import { spawn, type ChildProcess } from 'node:child_process';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parseFullReport, parseActionPlan } from './parser';
import type { AuditProgress } from './types';

/** Map of active audit processes keyed by auditId */
const activeProcesses = new Map<string, ChildProcess>();

/** Map of progress data keyed by auditId for SSE polling */
const auditProgressMap = new Map<string, AuditProgress>();

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
 */
export function isAuditRunning(auditId: string): boolean {
  return activeProcesses.has(auditId);
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
): Promise<void> {
  if (!isClaudeCliAvailable()) {
    await updateAuditStatus(baseApiUrl, auditId, 'failed', {
      errorMessage: 'Claude CLI is not installed. Install it with: npm install -g @anthropic-ai/claude-code',
    });
    return;
  }

  if (activeProcesses.has(auditId)) {
    return;
  }

  const domain = extractDomain(url);
  const prompt = `Run /seo-audit ${url}. Save all output files to output/${domain}/`;

  // Update status to running
  await updateAuditStatus(baseApiUrl, auditId, 'running', {
    startedAt: new Date().toISOString(),
  });

  // Set initial progress
  auditProgressMap.set(auditId, {
    percentage: 5,
    stage: 'Starting audit',
    message: `Starting SEO audit for ${url}`,
    timestamp: new Date(),
  });

  const child = spawn('claude', [
    '--print',
    '--dangerously-skip-permissions',
    '-p',
    prompt,
  ], {
    cwd: PROJECT_ROOT,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  activeProcesses.set(auditId, child);
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
    stderrBuffer += data.toString();
  });

  child.on('close', async (code) => {
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
      const outputDir = path.join(PROJECT_ROOT, 'output', domain);
      const reportPath = path.join(outputDir, 'FULL-AUDIT-REPORT.md');
      const actionPlanPath = path.join(outputDir, 'ACTION-PLAN.md');

      let parsedReport = null;
      let parsedActionPlan = null;

      if (existsSync(reportPath)) {
        const reportMd = readFileSync(reportPath, 'utf-8');
        parsedReport = parseFullReport(reportMd);
      }

      if (existsSync(actionPlanPath)) {
        const actionPlanMd = readFileSync(actionPlanPath, 'utf-8');
        parsedActionPlan = parseActionPlan(actionPlanMd);
      }

      // Store results via API
      const updateData: Record<string, unknown> = {
        status: 'completed',
        completedAt: new Date().toISOString(),
      };

      if (parsedReport) {
        updateData.overallScore = parsedReport.overallScore;
        updateData.businessType = parsedReport.businessType;
        updateData.pagesCrawled = parsedReport.pagesCrawled;
        updateData.fullReportMd = parsedReport.fullReportMd;
        updateData.categories = parsedReport.categories;
      }

      if (parsedActionPlan) {
        updateData.actionPlanMd = parsedActionPlan.actionPlanMd;
        updateData.issues = parsedActionPlan.issues;
      }

      await updateAuditStatus(baseApiUrl, auditId, 'completed', updateData);

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
