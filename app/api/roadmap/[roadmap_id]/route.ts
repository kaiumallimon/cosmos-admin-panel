import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

// GET /api/roadmap/[roadmap_id]  →  GET /roadmap/{roadmap_id}
export async function GET(
  req: NextRequest,
  { params }: { params: { roadmap_id: string } }
) {
  try {
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serverUrl = process.env.SERVER_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${serverUrl}/roadmap/${params.roadmap_id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch roadmap' }, { status: 500 });
  }
}

// DELETE /api/roadmap/[roadmap_id]  →  DELETE /roadmap/{roadmap_id}
export async function DELETE(
  req: NextRequest,
  { params }: { params: { roadmap_id: string } }
) {
  try {
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serverUrl = process.env.SERVER_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${serverUrl}/roadmap/${params.roadmap_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Failed to delete roadmap' }, { status: 500 });
  }
}
