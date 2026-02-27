import { NextResponse } from 'next/server';
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

function getIdFromUrl(req: Request): string {
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  return segments[segments.length - 1];
}

// GET /api/agents/[id] - Proxy to backend GET /agents/{id}
async function getHandler(req: AuthenticatedRequest) {
  try {
    const id = getIdFromUrl(req);
    const token = getAccessToken(req);
    if (!token) return NextResponse.json({ error: 'Access token required' }, { status: 401 });

    const res = await fetch(`${BACKEND_URL}/agents/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.detail || 'Failed to fetch agent' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch agent: ' + error.message }, { status: 500 });
  }
}

// PATCH /api/agents/[id] - Proxy to backend PATCH /agents/{id}
async function patchHandler(req: AuthenticatedRequest) {
  try {
    const id = getIdFromUrl(req);
    const token = getAccessToken(req);
    if (!token) return NextResponse.json({ error: 'Access token required' }, { status: 401 });

    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/agents/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.detail || 'Failed to update agent' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update agent: ' + error.message }, { status: 500 });
  }
}

// DELETE /api/agents/[id] - Proxy to backend DELETE /agents/{id}
async function deleteHandler(req: AuthenticatedRequest) {
  try {
    const id = getIdFromUrl(req);
    const token = getAccessToken(req);
    if (!token) return NextResponse.json({ error: 'Access token required' }, { status: 401 });

    const url = new URL(req.url);
    const hard = url.searchParams.get('hard') || 'false';

    const res = await fetch(`${BACKEND_URL}/agents/${id}?hard=${hard}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.detail || 'Failed to delete agent' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete agent: ' + error.message }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
