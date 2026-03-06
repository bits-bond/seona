import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// GET /api/projects — list all projects with computed audit fields
export async function GET() {
  try {
    const rows = await db.execute(sql`
      SELECT
        p.id,
        p.name,
        p.url,
        p.created_at  AS "createdAt",
        p.updated_at  AS "updatedAt",
        (SELECT a.overall_score
         FROM audits a
         WHERE a.project_id = p.id AND a.status = 'completed'
         ORDER BY a.completed_at DESC LIMIT 1
        ) AS "lastAuditScore",
        (SELECT a.completed_at
         FROM audits a
         WHERE a.project_id = p.id AND a.status = 'completed'
         ORDER BY a.completed_at DESC LIMIT 1
        ) AS "lastAuditDate",
        (SELECT COUNT(*)::int
         FROM audits a
         WHERE a.project_id = p.id
        ) AS "auditCount"
      FROM projects p
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json(rows);
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
