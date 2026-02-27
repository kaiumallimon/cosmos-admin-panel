import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

const BASE = process.env.SERVER_BASE_URL || 'http://localhost:8000';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ student_id: string; course_id: string }> },
) {
  const { student_id, course_id } = await params;
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const res = await fetch(
    `${BASE}/api/v1/performance/weaknesses/${student_id}/course/${course_id}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
