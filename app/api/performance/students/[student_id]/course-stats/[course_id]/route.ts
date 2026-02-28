import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

const BASE = process.env.SERVER_BASE_URL || 'http://localhost:8000';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ student_id: string; course_id: string }> },
) {
  const { student_id, course_id } = await params;

  try {
    // ── 1. Fetch enrollment data from MongoDB student_courses ──────────────────
    const { db } = await connectToDatabase();
    const enrollment = await db
      .collection('student_courses')
      .findOne(
        { student_id, course_id },
        { sort: { created_at: -1 } } as any,
      );

    const ct_count: number = enrollment?.ct_count ?? 0;
    const assignment_count: number = enrollment?.assignment_count ?? 0;

    // ── 2. Fetch assessments for this student+course from external API ──────────
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    let assessments: any[] = [];
    try {
      const aRes = await fetch(
        `${BASE}/api/v1/performance/assessments/student/${student_id}/course/${course_id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (aRes.ok) {
        const aData = await aRes.json();
        assessments = Array.isArray(aData) ? aData : [];
      }
    } catch {
      // external server unavailable — continue with empty
    }

    // ── 3. Calculate average CT mark percentage ────────────────────────────────
    const ctAssessments = assessments.filter((a) => a.assessment_type === 'ct');
    const avg_ct_percentage: number | null =
      ctAssessments.length > 0
        ? Math.round(
            (ctAssessments.reduce((sum, a) => {
              const marks = a.marks ?? a.score ?? 0;
              const full = a.full_marks ?? a.max_score ?? 1;
              return sum + (marks / full) * 100;
            }, 0) /
              ctAssessments.length) *
              10,
          ) / 10
        : null;

    return NextResponse.json({
      ct_count,
      assignment_count,
      avg_ct_percentage,
      ct_assessments_taken: ctAssessments.length,
      total_assessments: assessments.length,
    });
  } catch (error) {
    console.error(
      'Error in GET /api/performance/students/[student_id]/course-stats/[course_id]:',
      error,
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
