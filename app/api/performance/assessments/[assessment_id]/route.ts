import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

const BASE = process.env.SERVER_BASE_URL || 'http://localhost:8000';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assessment_id: string }> },
) {
  const { assessment_id } = await params;
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const res = await fetch(`${BASE}/api/v1/performance/assessments/${assessment_id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ assessment_id: string }> },
) {
  const { assessment_id } = await params;
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const body = await req.json();
  const res = await fetch(`${BASE}/api/v1/performance/assessments/${assessment_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ assessment_id: string }> },
) {
  const { assessment_id } = await params;
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const res = await fetch(`${BASE}/api/v1/performance/assessments/${assessment_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
