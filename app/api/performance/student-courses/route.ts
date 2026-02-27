import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

const BASE = process.env.SERVER_BASE_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const body = await req.json();
  const res = await fetch(`${BASE}/api/v1/performance/student-courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const body = await req.json();
  const res = await fetch(`${BASE}/api/v1/performance/student-courses`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
