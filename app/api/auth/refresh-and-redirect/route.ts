import { NextRequest, NextResponse } from 'next/server';
import {
  refreshAccessToken,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth-server-only';

/**
 * GET /api/auth/refresh-and-redirect?to=<returnPath>
 *
 * Called by the middleware when the access token has expired but a refresh
 * token cookie is present. Silently rotates both tokens and redirects the
 * browser back to the originally requested page.
 *
 * If the refresh token is missing or itself expired the user is sent to the
 * login page and all auth cookies are cleared.
 */
export async function GET(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const returnTo = req.nextUrl.searchParams.get('to') || '/';

  // No refresh token — clear cookies and go to login
  if (!refreshToken) {
    const res = NextResponse.redirect(new URL('/', req.url));
    res.cookies.set(ACCESS_TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
    res.cookies.set('token', '', { maxAge: 0, path: '/' });
    return res;
  }

  const result = await refreshAccessToken(refreshToken);

  if (!result.success || !result.tokens) {
    // Refresh token is expired/revoked — force login
    const res = NextResponse.redirect(new URL('/', req.url));
    res.cookies.set(ACCESS_TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
    res.cookies.set(REFRESH_TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
    res.cookies.set('token', '', { maxAge: 0, path: '/' });
    return res;
  }

  // Success — set new tokens and redirect to the originally requested page
  const res = NextResponse.redirect(new URL(returnTo, req.url));

  res.cookies.set(ACCESS_TOKEN_COOKIE, result.tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  });

  res.cookies.set(REFRESH_TOKEN_COOKIE, result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  // Non-httpOnly copy for middleware JWT decoding
  res.cookies.set('token', result.tokens.accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  });

  return res;
}
