import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 900, height: 1273 } });
const filePath = resolve(process.argv[2]);
await page.goto(pathToFileURL(filePath).href, { waitUntil: 'networkidle' });

const outDir = resolve(process.argv[3]);
await page.screenshot({ path: `${outDir}/page-1-cover.png` });
await page.evaluate(() => window.scrollTo(0, 1273));
await page.screenshot({ path: `${outDir}/page-2-score.png` });
await page.evaluate(() => window.scrollTo(0, 2546));
await page.screenshot({ path: `${outDir}/page-3-prompts.png` });
await page.evaluate(() => window.scrollTo(0, 3819));
await page.screenshot({ path: `${outDir}/page-4-actionplan.png` });
await browser.close();
console.log('done');
