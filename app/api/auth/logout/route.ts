import { NextRequest, NextResponse } from 'next/server';
import { signOut, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth-server-only';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    
    // Revoke refresh token in database
    if (refreshToken) {
      await signOut(refreshToken);
    }
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
    
    // Clear cookies
    response.cookies.set(ACCESS_TOKEN_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    response.cookies.set('token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}