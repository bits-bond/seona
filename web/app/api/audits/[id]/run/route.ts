import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { audits, projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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

  // Fetch the audit record directly from DB
  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, auditId),
  });

  if (!audit) {
    return NextResponse.json(
      { error: 'Audit not found' },
      { status: 404 },
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

  // Get the project URL
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, audit.projectId),
  });

  const url = project?.url;
  if (!url) {
    return NextResponse.json(
      { error: 'No URL found for this audit\'s project' },
      { status: 400 },
    );
  }

  // Start the audit asynchronously and return immediately
  const baseUrl = request.nextUrl.origin;
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
