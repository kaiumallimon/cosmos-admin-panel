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

// GET /api/performance/courses — proxy to GET /api/v1/performance/courses
async function getHandler(req: AuthenticatedRequest) {
  try {
    const token = getAccessToken(req);
    if (!token) return NextResponse.json({ error: 'Access token required' }, { status: 401 });

    const res = await fetch(`${BACKEND_URL}/api/v1/performance/courses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.detail || 'Failed to fetch performance courses' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching performance courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses: ' + error.message }, { status: 500 });
  }
}

// POST /api/performance/courses — proxy to POST /api/v1/performance/courses
async function postHandler(req: AuthenticatedRequest) {
  try {
    const token = getAccessToken(req);
    if (!token) return NextResponse.json({ error: 'Access token required' }, { status: 401 });

    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/api/v1/performance/courses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.detail || 'Failed to create performance course' }, { status: res.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating performance course:', error);
    return NextResponse.json({ error: 'Failed to create course: ' + error.message }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
