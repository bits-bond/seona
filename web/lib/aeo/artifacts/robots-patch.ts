const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'];

export interface RobotsPatchInput {
  existing?: string;
}

export interface RobotsPatchOutput {
  diff: string;
  fullProposed: string;
  changes: string[];
}

export function generateRobotsPatch(input: RobotsPatchInput = {}): RobotsPatchOutput {
  const existing = (input.existing ?? '').trim();
  const present = new Set<string>();
  const lines = existing.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*User-agent:\s*(.+)$/i);
    if (m) present.add(m[1].trim());
  }

  const toAdd: string[] = [];
  for (const ua of AI_CRAWLERS) {
    if (!present.has(ua) && !present.has('*')) {
      toAdd.push(ua);
    } else if (!present.has(ua)) {
      // present has '*' — we still explicitly allow each AI crawler so future global blocks don't accidentally block them
      toAdd.push(ua);
    }
  }

  const addedBlock = toAdd
    .map((ua) => `User-agent: ${ua}\nAllow: /\n`)
    .join('\n');

  const fullProposed = existing
    ? `${existing.trim()}\n\n# --- AEO: AI Crawler Freigabe (Seona) ---\n${addedBlock}`.trim()
    : `# AEO: AI Crawler Freigabe (Seona)\n${addedBlock}`.trim();

  const diff = buildUnifiedDiff(existing, fullProposed);
  return {
    diff,
    fullProposed,
    changes: toAdd.map((ua) => `Freigabe für ${ua}`),
  };
}

function buildUnifiedDiff(before: string, after: string): string {
  const beforeLines = before ? before.split('\n') : [];
  const afterLines = after.split('\n');
  return [
    `--- robots.txt (vorher)`,
    `+++ robots.txt (nachher)`,
    `@@ -1,${beforeLines.length || 0} +1,${afterLines.length} @@`,
    ...beforeLines.map((l) => `-${l}`),
    ...afterLines.map((l) => `+${l}`),
  ].join('\n');
}
