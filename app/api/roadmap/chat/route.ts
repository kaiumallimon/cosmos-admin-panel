import { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const serverUrl = process.env.SERVER_BASE_URL || 'http://localhost:8000';

    const upstreamResponse = await fetch(`${serverUrl}/api/v1/roadmap/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
    });

    if (!upstreamResponse.ok) {
      const errText = await upstreamResponse.text();
      return new Response(errText, { status: upstreamResponse.status });
    }

    // Stream the SSE response directly to the client
    const { readable, writable } = new TransformStream();
    upstreamResponse.body?.pipeTo(writable).catch(() => {});

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    console.error('Error proxying roadmap chat:', error);
    return new Response(JSON.stringify({ error: 'Failed to contact roadmap chat service' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
