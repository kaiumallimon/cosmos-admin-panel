import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { Document } from 'mongodb';

interface StudentCourse extends Document {
  enrollment_id: string;
  student_id: string;
  course_id: string;
  course_title: string;
  credit: number;
  trimester: string;
  section?: string;
  faculty?: string;
  ct_count?: number;
  assignment_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

export const GET = withAnyAuth(
  async (_req: AuthenticatedRequest, context: { params: Promise<{ student_id: string }> }) => {
    try {
      const { student_id } = await context.params;

      const url = new URL(_req.url);
      const trimester = url.searchParams.get('trimester');

      const collection = await getCollection<StudentCourse>('student_courses');

      const query: Record<string, string> = { student_id };
      if (trimester) query.trimester = trimester;

      const enrollments = await collection.find(query).toArray();

      const result = enrollments.map((e) => ({
        enrollment_id: e.enrollment_id ?? String(e._id),
        student_id: e.student_id,
        course_id: e.course_id,
        course_title: e.course_title,
        credit: e.credit,
        trimester: e.trimester,
        section: e.section ?? null,
        faculty: e.faculty ?? null,
        ct_count: e.ct_count ?? 0,
        assignment_count: e.assignment_count ?? 0,
      }));

      return NextResponse.json(result);
    } catch (err: unknown) {
      console.error('enrollments fetch error:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Something went wrong' },
        { status: 500 },
      );
    }
  },
);
