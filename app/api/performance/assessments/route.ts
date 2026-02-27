import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

const BASE = process.env.SERVER_BASE_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const body = await req.json();
  const res = await fetch(`${BASE}/api/v1/performance/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
