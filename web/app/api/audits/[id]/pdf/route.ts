import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { audits, auditCategories, auditIssues, projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generatePdf } from '@/lib/pdf/renderer';
import { loadScreenshots } from '@/lib/pdf/screenshots';
import { CATEGORY_CONFIG } from '@/types';
import type { Language, CategoryType } from '@/types';
import type { PdfType, PdfAuditData, PdfCategoryData, PdfIssueData } from '@/lib/pdf/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid audit ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') ?? 'executive') as PdfType;
    const langParam = searchParams.get('lang') as Language | null;

    if (type !== 'executive' && type !== 'full') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "executive" or "full".' },
        { status: 400 },
      );
    }

    // Fetch audit
    const audit = await db.query.audits.findFirst({
      where: eq(audits.id, id),
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    if (audit.status !== 'completed') {
      return NextResponse.json(
        { error: 'Audit is not completed yet' },
        { status: 400 },
      );
    }

    // Use lang param or fall back to audit language
    const lang: Language = langParam ?? (audit.language as Language) ?? 'en';

    // Fetch project
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, audit.projectId),
    });

    // Fetch categories and issues
    const categories = await db
      .select()
      .from(auditCategories)
      .where(eq(auditCategories.auditId, id));

    const issues = await db
      .select()
      .from(auditIssues)
      .where(eq(auditIssues.auditId, id))
      .orderBy(auditIssues.orderIndex);

    // Extract domain for screenshots
    let domain = '';
    try {
      const url = new URL(project?.url ?? '');
      domain = url.hostname.replace(/^www\./, '');
    } catch {
      domain = project?.url?.replace(/https?:\/\//, '').replace(/\/.*/, '').replace(/^www\./, '') ?? '';
    }

    // Load screenshots
    const screenshots = loadScreenshots(domain);

    // Build PDF data
    const pdfCategories: PdfCategoryData[] = categories.map((c) => ({
      category: c.category as CategoryType,
      label: CATEGORY_CONFIG[c.category as CategoryType]?.label ?? c.category,
      score: c.score,
      weight: c.weight,
      weightedScore: c.weightedScore,
    }));

    const pdfIssues: PdfIssueData[] = issues.map((i) => ({
      severity: i.severity as PdfIssueData['severity'],
      title: i.title,
      description: i.description ?? '',
      impact: i.impact,
      recommendation: i.recommendation,
      category: (i.category as CategoryType) ?? null,
    }));

    const pdfData: PdfAuditData = {
      id: audit.id,
      projectName: project?.name ?? 'Unknown',
      projectUrl: project?.url ?? '',
      overallScore: audit.overallScore ?? 0,
      businessType: audit.businessType,
      pagesCrawled: audit.pagesCrawled,
      completedAt: audit.completedAt ?? new Date(),
      fullReportMd: audit.fullReportMd,
      actionPlanMd: audit.actionPlanMd,
      language: lang,
      categories: pdfCategories,
      issues: pdfIssues,
      screenshots,
    };

    // Generate PDF
    const pdfBuffer = await generatePdf(pdfData, type, lang);

    // Build filename
    const dateStr = new Date(audit.completedAt ?? Date.now())
      .toISOString()
      .split('T')[0];
    const typeLabel = type === 'executive' ? 'Executive' : 'Full_Report';
    const filename = `SEONA_${typeLabel}_${domain}_${dateStr}_${lang.toUpperCase()}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 },
    );
  }
}
