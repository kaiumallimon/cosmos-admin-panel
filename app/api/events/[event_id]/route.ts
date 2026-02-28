import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

const BASE = process.env.SERVER_BASE_URL || 'http://localhost:8000';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ event_id: string }> },
) {
  const { event_id } = await params;
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const body = await req.json();
  const res = await fetch(`${BASE}/api/v1/events/${event_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ event_id: string }> },
) {
  const { event_id } = await params;
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const res = await fetch(`${BASE}/api/v1/events/${event_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 200 || res.status === 204) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
