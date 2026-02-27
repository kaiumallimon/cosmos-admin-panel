import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

// GET /api/roadmap/[roadmap_id]/progress  →  GET /roadmap/{roadmap_id}/progress
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roadmap_id: string }> }
) {
  try {
    const { roadmap_id } = await params;
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serverUrl = process.env.SERVER_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${serverUrl}/roadmap/${roadmap_id}/progress`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

// PUT /api/roadmap/[roadmap_id]/progress  →  PUT /roadmap/{roadmap_id}/progress
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ roadmap_id: string }> }
) {
  try {
    const { roadmap_id } = await params;
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const serverUrl = process.env.SERVER_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${serverUrl}/roadmap/${roadmap_id}/progress`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
