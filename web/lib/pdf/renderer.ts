import type { Browser } from 'playwright';
import type { Language } from '@/types';
import type { PdfType, PdfAuditData } from './types';
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
 */
export async function generatePdf(
  data: PdfAuditData,
  type: PdfType,
  lang: Language,
): Promise<Buffer> {
  const html =
    type === 'executive'
      ? buildExecutiveHtml(data, lang)
      : buildFullReportHtml(data, lang);

  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.setContent(html, { waitUntil: 'networkidle' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="width: 100%; font-size: 8px; color: #6868a0; padding: 0 15mm; display: flex; justify-content: space-between;">
        <span style="font-weight: 700; letter-spacing: 2px; color: #e05a33;">SEONA</span>
        <span>${data.projectUrl}</span>
      </div>
    `,
    footerTemplate: `
      <div style="width: 100%; font-size: 8px; color: #6868a0; padding: 0 15mm; display: flex; justify-content: space-between;">
        <span>${lang === 'de' ? 'Vertraulich' : 'Confidential'}</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: '20mm',
      bottom: '25mm',
      left: '15mm',
      right: '15mm',
    },
  });

  await context.close();

  return Buffer.from(pdfBuffer);
}
