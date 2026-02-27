import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

// POST /api/roadmap/[roadmap_id]/chat  →  POST /roadmap/{roadmap_id}/chat
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roadmap_id: string }> }
) {
  try {
    const { roadmap_id } = await params;
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const serverUrl = process.env.SERVER_BASE_URL || 'http://localhost:8000';

    const response = await fetch(`${serverUrl}/roadmap/${roadmap_id}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// GET /api/roadmap/[roadmap_id]/chat  →  GET /roadmap/{roadmap_id}/chat
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roadmap_id: string }> }
) {
  try {
    const { roadmap_id } = await params;
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serverUrl = process.env.SERVER_BASE_URL || 'http://localhost:8000';

    const response = await fetch(`${serverUrl}/roadmap/${roadmap_id}/chat`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
}
