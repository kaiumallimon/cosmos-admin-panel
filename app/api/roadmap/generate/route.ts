import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const serverUrl = process.env.SERVER_BASE_URL || 'http://localhost:8000';

    const response = await fetch(`${serverUrl}/roadmap/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying roadmap generate:', error);
    return NextResponse.json({ error: 'Failed to generate roadmap' }, { status: 500 });
  }
}
