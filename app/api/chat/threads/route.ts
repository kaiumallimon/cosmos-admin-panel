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

    // Extract pagination parameters from URL
    const url = new URL(req.url);
    const skip = url.searchParams.get('skip') || '0';
    const limit = url.searchParams.get('limit') || '10';

    // Convert skip to offset for backend API
    const offset = skip;

    // Fetch threads from the external API with pagination
    const response = await fetch(`${SERVER_BASE_URL}/chat/threads?offset=${offset}&limit=${limit}`, {
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

    // Backend returns { threads: [...], pagination: { total, limit, offset, count, has_more } }
    const threadsArray = data.threads || [];
    const totalCount = data.pagination?.total || 0;

    // Return normalized response for frontend
    const responseData = {
      threads: threadsArray,
      total: totalCount,
    };

    console.log('Fetched threads:', responseData);

    return NextResponse.json(responseData, { status: 200 });

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
