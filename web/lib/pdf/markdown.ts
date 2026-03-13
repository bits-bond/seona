import { Marked } from 'marked';

const md = new Marked({ async: false, gfm: true, breaks: false });

/** Render full markdown (headings, lists, tables, code blocks, etc.) to HTML */
export function renderMarkdown(text: string): string {
  return md.parse(text, { async: false }) as string;
}

/** Render inline markdown only (bold, italic, code, links — no block elements) to HTML */
export function renderInlineMarkdown(text: string): string {
  return md.parseInline(text, { async: false }) as string;
}
