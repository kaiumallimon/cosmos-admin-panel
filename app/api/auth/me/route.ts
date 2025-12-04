import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, ACCESS_TOKEN_COOKIE } from '@/lib/auth-server-only';

export async function GET(request: NextRequest) {
  try {
    // Get access token from Authorization header or cookies
    const authHeader = request.headers.get('Authorization');
    let accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!accessToken) {
      // Fallback to cookies
      accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value || null;
    }
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }
    
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}