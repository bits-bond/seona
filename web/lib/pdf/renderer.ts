import type { Browser } from 'playwright';
import type { Language } from '@/types';
import type { PdfType, PdfAuditData, PdfTheme } from './types';
import { buildExecutiveHtml } from './template-executive';
import { buildFullReportHtml } from './template-full';

/** HMR-safe browser cache via globalThis */
const globalForPdf = globalThis as typeof globalThis & { __pdfBrowser?: Browser };

async function getBrowser(): Promise<Browser> {
  if (globalForPdf.__pdfBrowser?.isConnected()) {
    return globalForPdf.__pdfBrowser;
  }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  globalForPdf.__pdfBrowser = browser;
  return browser;
}

/**
 * Generate a PDF buffer from audit data.
 * Each page is a self-contained slide — margins and headers/footers
 * are rendered inside the HTML, not by Playwright.
 */
export async function generatePdf(
  data: PdfAuditData,
  type: PdfType,
  lang: Language,
  theme: PdfTheme = 'dark',
): Promise<Buffer> {
  const html =
    type === 'executive'
      ? buildExecutiveHtml(data, lang, theme)
      : buildFullReportHtml(data, lang, theme);

  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.setContent(html, { waitUntil: 'networkidle' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
  });

  await context.close();

  return Buffer.from(pdfBuffer);
}
