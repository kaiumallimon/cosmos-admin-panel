import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware-with-logging';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL;

if (!SERVER_BASE_URL) {
  throw new Error('SERVER_BASE_URL must be defined in environment variables');
}

async function getHandler(req: AuthenticatedRequest) {
  try {
    // Get the access token from the authenticated request
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader || '');
    const accessToken = cookies['access_token'] || cookies['token'];

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 401 }
      );
    }

    // Fetch threads from the external API
    const response = await fetch(`${SERVER_BASE_URL}/chat/threads`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch threads' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch threads from external API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to parse cookies
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim();
    }
  });
  return cookies;
}

export const GET = withAuth(getHandler);
