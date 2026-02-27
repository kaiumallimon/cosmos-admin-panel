import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

// GET /api/roadmap/threads  →  GET /roadmap/ on backend (list all user roadmaps)
export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverUrl = process.env.SERVER_BASE_URL || 'http://localhost:8000';

    const response = await fetch(`${serverUrl}/roadmap/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error fetching roadmaps:', error);
    return NextResponse.json({ error: 'Failed to fetch roadmaps' }, { status: 500 });
  }
}
