import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverUrl = process.env.SERVER_BASE_URL || 'http://localhost:8000';

    const response = await fetch(`${serverUrl}/api/v1/roadmap/threads`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error fetching roadmap threads:', error);
    return NextResponse.json({ error: 'Failed to fetch roadmap threads' }, { status: 500 });
  }
}
