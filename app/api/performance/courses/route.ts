import { NextResponse } from 'next/server';
import { withAnyAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { Document } from 'mongodb';

interface Course extends Document {
  /** UUID — this is the field used as course_id in assessments/enrollments (NOT _id) */
  id: string;
  title: string;
  code: string;
  credit: number;
  department: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * GET /api/performance/courses?ids=uuid1,uuid2,...
 *
 * Looks up courses from the `courses` MongoDB collection by their `id`
 * (UUID field, NOT _id) and returns human-readable title + metadata.
 *
 * Query params:
 *   ids  — comma-separated list of course UUIDs to filter by.
 *          If omitted, returns ALL courses.
 */
export const GET = withAnyAuth(async (_req: AuthenticatedRequest) => {
  try {
    const url = new URL(_req.url);
    const idsParam = url.searchParams.get('ids');

    const collection = await getCollection<Course>('courses');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (idsParam) {
      const ids = idsParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        query.id = { $in: ids };
      }
    }

    const courses = await collection.find(query).toArray();

    const result = courses.map((c) => ({
      id: c.id,       // UUID — matches course_id in assessments
      title: c.title,
      code: c.code,
      credit: c.credit,
      department: c.department,
    }));

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('courses fetch error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Something went wrong' },
      { status: 500 },
    );
  }
});
