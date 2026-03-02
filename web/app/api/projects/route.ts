import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, audits } from '@/lib/db/schema';
import { desc, eq, sql, count, max } from 'drizzle-orm';

// GET /api/projects — list all projects with computed audit fields
export async function GET() {
  try {
    const result = await db
      .select({
        id: projects.id,
        name: projects.name,
        url: projects.url,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        lastAuditScore: sql<number | null>`(
          SELECT ${audits.overallScore}
          FROM ${audits}
          WHERE ${audits.projectId} = ${projects.id}
            AND ${audits.status} = 'completed'
          ORDER BY ${audits.completedAt} DESC
          LIMIT 1
        )`.as('last_audit_score'),
        lastAuditDate: sql<Date | null>`(
          SELECT ${audits.completedAt}
          FROM ${audits}
          WHERE ${audits.projectId} = ${projects.id}
            AND ${audits.status} = 'completed'
          ORDER BY ${audits.completedAt} DESC
          LIMIT 1
        )`.as('last_audit_date'),
        auditCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${audits}
          WHERE ${audits.projectId} = ${projects.id}
        )`.as('audit_count'),
      })
      .from(projects)
      .orderBy(desc(projects.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects — create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    const [project] = await db
      .insert(projects)
      .values({
        name: body.name,
        url: body.url,
      })
      .returning();

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
