import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware-with-logging';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

const BACKEND_URL = process.env.SERVER_BASE_URL || 'http://localhost:8000';

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), decodeURIComponent(v.join('='))];
    })
  );
}

function getAccessToken(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  return cookies[ACCESS_TOKEN_COOKIE] || cookies['token'] || null;
}

// PUT /api/performance/topics/[id] — proxy to PUT /api/v1/performance/topics/{topic_id}
async function putHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getAccessToken(req);
    if (!token) return NextResponse.json({ error: 'Access token required' }, { status: 401 });

    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/api/v1/performance/topics/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.detail || 'Failed to update topic' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating topic:', error);
    return NextResponse.json({ error: 'Failed to update topic: ' + error.message }, { status: 500 });
  }
}

// DELETE /api/performance/topics/[id] — proxy to DELETE /api/v1/performance/topics/{topic_id}
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getAccessToken(req);
    if (!token) return NextResponse.json({ error: 'Access token required' }, { status: 401 });

    const res = await fetch(`${BACKEND_URL}/api/v1/performance/topics/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 204) {
      return NextResponse.json({ success: true });
    }

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.detail || 'Failed to delete topic' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error deleting topic:', error);
    return NextResponse.json({ error: 'Failed to delete topic: ' + error.message }, { status: 500 });
  }
}

export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
