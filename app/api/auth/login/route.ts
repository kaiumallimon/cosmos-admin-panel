import { NextRequest, NextResponse } from 'next/server';
import { signInWithEmail, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    const result = await signInWithEmail(email, password);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }
    
    // Create response with user data and tokens
    const response = NextResponse.json({
      success: true,
      user: result.user,
      tokens: result.tokens, // Include tokens in response for API usage
    });
    
    // Set HTTP-only cookies for tokens
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
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}