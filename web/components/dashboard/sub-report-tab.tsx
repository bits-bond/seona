"use client";

import { useState, useCallback } from 'react';
import { MarkdownRenderer } from '@/components/ui';
import { Copy, Check, Info } from 'lucide-react';

interface SubReportTabProps {
  title: string;
  content: string;
  source: string;
}

export function SubReportTab({ title, content, source }: SubReportTabProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  return (
    <div>
      {source === 'parsed' && (
        <div className="mb-4 flex items-start gap-2 px-4 py-2.5 rounded-lg bg-warning-50/50 border border-warning-200/50 text-warning-700 text-sm">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Showing excerpt from the full report. Detailed sub-audit file not available for this audit.</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-default-100 hover:bg-default-200 text-default-600 hover:text-foreground transition-colors"
          title="Copy markdown"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="p-4 rounded-xl bg-content1 border border-divider overflow-auto max-h-[900px]">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
