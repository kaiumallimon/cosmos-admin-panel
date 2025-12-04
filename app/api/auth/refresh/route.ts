import { NextRequest, NextResponse } from 'next/server';
import { 
  refreshAccessToken, 
  ACCESS_TOKEN_COOKIE, 
  REFRESH_TOKEN_COOKIE 
} from '@/lib/auth-server-only';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      );
    }
    
    const result = await refreshAccessToken(refreshToken);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
    });
    
    // Set new tokens as cookies
    if (result.tokens) {
      response.cookies.set(ACCESS_TOKEN_COOKIE, result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
        path: '/',
      });
      
      response.cookies.set(REFRESH_TOKEN_COOKIE, result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
      
      // Also set a non-HTTP-only cookie for middleware access
      response.cookies.set('token', result.tokens.accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
        path: '/',
      });
    }
    
    return response;
  } catch (error) {
    console.error('Refresh token API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}