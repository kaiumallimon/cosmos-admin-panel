import { NextRequest, NextResponse } from "next/server";
import { withAuthAny, AuthenticatedRequest } from '@/lib/api-middleware-with-logging';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL;

if (!SERVER_BASE_URL) {
  throw new Error('SERVER_BASE_URL must be defined in environment variables');
}

async function postHandler(req: AuthenticatedRequest) {
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

    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate optional thread_id
    if (body.thread_id && typeof body.thread_id !== 'string') {
      return NextResponse.json(
        { error: 'thread_id must be a string if provided' },
        { status: 400 }
      );
    }

    // Prepare the request body for external API
    const requestBody: { message: string; thread_id?: string } = {
      message: body.message,
    };

    if (body.thread_id) {
      requestBody.thread_id = body.thread_id;
    }

    // Send message to the external API
    const response = await fetch(`${SERVER_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to send message to external API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('Error sending message:', error);
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

export const POST = withAuthAny(postHandler);
