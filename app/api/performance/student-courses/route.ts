import { NextResponse } from 'next/server';
import { withAnyAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { Document, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

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

interface Course extends Document {
  id: string;
  title: string;
  code: string;
  credit: number;
  department: string;
}

/**
 * POST /api/performance/student-courses
 * Enroll a student in a course by inserting into student_courses collection.
 * Body: { student_id, course_id, trimester, section, faculty }
 */
export const POST = withAnyAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { student_id, course_id, trimester, section, faculty } = body;

    if (!student_id || !course_id || !trimester) {
      return NextResponse.json({ error: 'student_id, course_id and trimester are required' }, { status: 400 });
    }

    // Look up course metadata
    const coursesCol = await getCollection<Course>('courses');
    const course = await coursesCol.findOne({ id: course_id });

    // Prevent duplicate enrollment
    const scCol = await getCollection<StudentCourse>('student_courses');
    const existing = await scCol.findOne({ student_id, course_id, trimester });
    if (existing) {
      return NextResponse.json({ error: 'Already enrolled in this course for this trimester' }, { status: 409 });
    }

    const enrollment: StudentCourse = {
      enrollment_id: uuidv4(),
      student_id,
      course_id,
      course_title: course?.title ?? '',
      credit: course?.credit ?? 0,
      trimester,
      section: section ?? null,
      faculty: faculty ?? null,
      ct_count: 0,
      assignment_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await scCol.insertOne(enrollment);
    return NextResponse.json(enrollment, { status: 201 });
  } catch (err: unknown) {
    console.error('enroll error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Something went wrong' }, { status: 500 });
  }
});

/**
 * DELETE /api/performance/student-courses
 * Unenroll a student using enrollment_id (preferred) or (student_id + course_id + trimester).
 * Body: { enrollment_id } OR { student_id, course_id, trimester }
 */
export const DELETE = withAnyAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const scCol = await getCollection<StudentCourse>('student_courses');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let filter: Record<string, any>;

    if (body.enrollment_id) {
      filter = { enrollment_id: body.enrollment_id };
    } else if (body.student_id && body.course_id && body.trimester) {
      filter = { student_id: body.student_id, course_id: body.course_id, trimester: body.trimester };
    } else {
      return NextResponse.json(
        { error: 'Provide enrollment_id or (student_id + course_id + trimester)' },
        { status: 400 }
      );
    }

    const result = await scCol.deleteOne(filter);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    console.error('unenroll error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Something went wrong' }, { status: 500 });
  }
});
