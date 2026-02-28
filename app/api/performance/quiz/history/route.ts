import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id');
  if (!studentId) return NextResponse.json({ error: 'student_id required' }, { status: 400 });

  try {
    const { db } = await connectToDatabase();
    const col = db.collection('performance_records');

    const records = await col
      .find({ student_id: studentId })
      .sort({ updated_at: -1 })
      .toArray();

    // Normalise _id to string so JSON serialises cleanly
    const data = records.map((r, idx) => ({
      id: r._id?.toString() ?? `record-${idx}`,
      student_id: r.student_id,
      course_id: r.course_id,
      topic_names: r.topic_names ?? [],
      topic_ids: r.topic_ids ?? [],
      attempt_no: r.attempt_no ?? 0,
      marks: r.marks ?? 0,
      full_marks: r.full_marks ?? 0,
      precision: r.precision ?? null,
      percentage: r.percentage != null && r.percentage !== 0
        ? r.percentage
        : r.marks != null && r.full_marks
          ? Math.round((r.marks / r.full_marks) * 100)
          : null,
      quiz_ids: Array.isArray(r.quiz_id) ? r.quiz_id : r.quiz_id ? [r.quiz_id] : [],
      right_answers: r.right_answers ?? [],
      wrong_answers: r.wrong_answers ?? [],
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error('Quiz history error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
