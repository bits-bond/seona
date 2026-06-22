import robotsParser from 'robots-parser';
import * as cheerio from 'cheerio';

const UA = 'Seona-AEO/1.0 (+https://github.com/AgriciDaniel/claude-seo)';
const MAX_HTML_BYTES = 1_000_000;
const FETCH_TIMEOUT_MS = 15000;

export interface ScrapedPage {
  url: string;
  ok: boolean;
  status?: number;
  title?: string;
  description?: string;
  mainText?: string;
  error?: string;
}

async function timedFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timeout);
  }
}

export async function isAllowedByRobots(url: string): Promise<boolean> {
  try {
    const u = new URL(url);
    const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
    const resp = await timedFetch(robotsUrl, { headers: { 'user-agent': UA } });
    if (!resp.ok) return true;
    const txt = await resp.text();
    const parser = robotsParser(robotsUrl, txt);
    return parser.isAllowed(url, UA) ?? true;
  } catch {
    return true;
  }
}

export async function scrapePage(url: string, opts: { respectRobots?: boolean } = {}): Promise<ScrapedPage> {
  const target = url.startsWith('http') ? url : `https://${url}`;
  if (opts.respectRobots !== false) {
    const allowed = await isAllowedByRobots(target);
    if (!allowed) {
      return { url: target, ok: false, error: 'blocked by robots.txt' };
    }
  }
  try {
    const resp = await timedFetch(target, { headers: { 'user-agent': UA, accept: 'text/html' } });
    if (!resp.ok) {
      return { url: target, ok: false, status: resp.status, error: `HTTP ${resp.status}` };
    }
    const reader = resp.body?.getReader();
    let html = '';
    if (reader) {
      const decoder = new TextDecoder();
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value?.byteLength ?? 0;
        if (received > MAX_HTML_BYTES) break;
        html += decoder.decode(value, { stream: true });
      }
    } else {
      html = await resp.text();
    }
    const $ = cheerio.load(html);
    const title = $('title').first().text().trim();
    const description = $('meta[name="description"]').attr('content') ?? $('meta[property="og:description"]').attr('content') ?? '';
    $('script, style, noscript, nav, footer, header').remove();
    const main = $('main, article, [role=main]').first();
    const root = main.length ? main : $('body');
    const mainText = root.text().replace(/\s+/g, ' ').trim().slice(0, 8000);
    return { url: target, ok: true, status: resp.status, title, description, mainText };
  } catch (err) {
    return { url: target, ok: false, error: (err as Error).message };
  }
}
