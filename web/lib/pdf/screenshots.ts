import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { PdfScreenshot } from './types';

const PROJECT_ROOT = path.resolve(process.cwd(), '..');

/**
 * Load screenshots from the output directory for a given domain.
 * Returns base64 data URIs with viewport/type metadata.
 */
export function loadScreenshots(domain: string): PdfScreenshot[] {
  const screenshotDir = path.join(PROJECT_ROOT, 'output', domain, 'screenshots');

  if (!existsSync(screenshotDir)) {
    return [];
  }

  const files = readdirSync(screenshotDir).filter((f) => f.endsWith('.png'));
  const screenshots: PdfScreenshot[] = [];

  for (const filename of files) {
    const filePath = path.join(screenshotDir, filename);
    try {
      const buffer = readFileSync(filePath);
      const base64 = buffer.toString('base64');
      const dataUri = `data:image/png;base64,${base64}`;

      // Parse filename: {page}_{device}_{type}.png
      const nameWithoutExt = filename.replace('.png', '');
      const parts = nameWithoutExt.split('_');

      const page = parts[0] ?? 'unknown';
      const device = (parts[1] === 'mobile' ? 'mobile' : 'desktop') as PdfScreenshot['device'];
      const type = parts.slice(2).join('_') || 'full';

      screenshots.push({
        filename,
        dataUri,
        page,
        device,
        type,
      });
    } catch {
      // Skip files that can't be read
    }
  }

  return screenshots;
}
