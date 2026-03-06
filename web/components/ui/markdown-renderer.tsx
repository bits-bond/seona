"use client";

import { useMemo } from "react";
import { marked } from "marked";
import { cn } from "@/lib/utils";

// Configure marked for GFM tables, task lists, etc.
marked.setOptions({
  gfm: true,
  breaks: false,
});

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const html = useMemo(() => {
    try {
      return marked.parse(content) as string;
    } catch {
      return `<pre>${content}</pre>`;
    }
  }, [content]);

  return (
    <div
      className={cn("markdown-body text-sm text-foreground leading-relaxed", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
