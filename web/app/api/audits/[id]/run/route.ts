import { NextRequest, NextResponse } from 'next/server';
import { startAudit, isClaudeCliAvailable, isAuditRunning } from '@/lib/audit-engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: auditId } = await params;

  // Check if claude CLI is available
  if (!isClaudeCliAvailable()) {
    return NextResponse.json(
      {
        error: 'Claude CLI is not installed',
        message: 'Install Claude Code CLI with: npm install -g @anthropic-ai/claude-code',
      },
      { status: 503 },
    );
  }

  // Check if this audit is already running
  if (isAuditRunning(auditId)) {
    return NextResponse.json(
      { error: 'Audit is already running' },
      { status: 409 },
    );
  }

  // Fetch the audit record to get the URL
  const baseUrl = request.nextUrl.origin;
  let audit;

  try {
    const response = await fetch(`${baseUrl}/api/audits/${auditId}`);
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 },
      );
    }
    audit = await response.json();
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch audit record' },
      { status: 500 },
    );
  }

  if (audit.status === 'running') {
    return NextResponse.json(
      { error: 'Audit is already running' },
      { status: 409 },
    );
  }

  if (audit.status === 'completed') {
    return NextResponse.json(
      { error: 'Audit has already completed. Create a new audit to re-run.' },
      { status: 400 },
    );
  }

  // Determine the URL — either from the audit record or from the project
  const url = audit.url || audit.project?.url;
  if (!url) {
    return NextResponse.json(
      { error: 'No URL found for this audit' },
      { status: 400 },
    );
  }

  // Start the audit asynchronously and return immediately
  startAudit(auditId, url, baseUrl);

  return NextResponse.json(
    {
      message: 'Audit started',
      auditId,
      streamUrl: `/api/audits/${auditId}/stream`,
    },
    { status: 202 },
  );
}
