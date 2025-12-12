import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware-with-logging';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL;

if (!SERVER_BASE_URL) {
  throw new Error('SERVER_BASE_URL must be defined in environment variables');
}

async function deleteHandler(
  req: AuthenticatedRequest,
  context: { params: Promise<{ thread_id: string }> }
) {
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

    // Get thread_id from params
    const { thread_id } = await context.params;

    if (!thread_id) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Delete thread from the external API
    const response = await fetch(`${SERVER_BASE_URL}/chat/threads/${thread_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { detail: 'Thread not found or unauthorized' },
          { status: 404 }
        );
      }

      const errorData = await response.json().catch(() => ({
        detail: 'Failed to delete thread'
      }));

      return NextResponse.json(
        { detail: errorData.detail || errorData.error || 'Failed to delete thread' },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting thread:', error);
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

export const DELETE = withAuth(deleteHandler);
