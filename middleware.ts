import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow public and static paths
    const isPublicPath = pathname === '/' ||
                        pathname.startsWith('/public') ||
                        pathname.startsWith('/api/auth/') ||
                        pathname.startsWith('/api/reset-password') ||
                        pathname.startsWith('/_next/static') ||
                        pathname.startsWith('/_next/image') ||
                        pathname === '/login' ||
                        pathname === '/register' ||
                        pathname === '/reset-password' ||
                        pathname === "/favicon.ico";

    if (isPublicPath) return NextResponse.next();

    // Check if this is an API route
    const isApiRoute = pathname.startsWith('/api/');

    // Get access token from cookies or Authorization header
    let accessToken = req.cookies.get("access_token")?.value || req.cookies.get("token")?.value;

    // For API routes, also check Authorization header
    if (!accessToken && isApiRoute) {
        const authHeader = req.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            accessToken = authHeader.substring(7);
        }
    }

    if (!accessToken) {
        if (isApiRoute) {
            // Return JSON error for API routes
            return NextResponse.json(
                { error: 'Access token required' },
                { status: 401 }
            );
        } else {
            // Redirect to login for browser requests
            const loginUrl = new URL('/', req.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Validate JWT format and decode payload to enforce role-based access.
    // Full signature verification happens in individual API routes (requires Node crypto).
    try {
        const parts = accessToken.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        // Decode payload (base64url → JSON) — no crypto needed
        const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson) as { role?: string; exp?: number };
        const role = payload.role ?? 'user';
        const nowSec = Date.now() / 1000;

        // ── Token expiry handling ─────────────────────────────────────────────
        if (payload.exp && nowSec > payload.exp) {
            if (!isApiRoute) {
                // For page navigation: redirect through silent refresh if refresh token is present
                const refreshToken = req.cookies.get('refresh_token')?.value;
                if (refreshToken) {
                    const refreshUrl = new URL('/api/auth/refresh-and-redirect', req.url);
                    refreshUrl.searchParams.set('to', pathname + (req.nextUrl.search || ''));
                    return NextResponse.redirect(refreshUrl);
                }
            }
            // API route or no refresh token available → 401 / send to login
            if (isApiRoute) {
                return NextResponse.json({ error: 'Access token expired' }, { status: 401 });
            }
            const loginUrl = new URL('/', req.url);
            const res = NextResponse.redirect(loginUrl);
            res.cookies.set('access_token', '', { maxAge: 0, path: '/' });
            res.cookies.set('token', '', { maxAge: 0, path: '/' });
            return res;
        }
        // ─────────────────────────────────────────────────────────────────────

        // Block non-admin users from /admin routes
        if (pathname.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL('/user', req.url));
        }

        // Block admin users from /user routes (send them to their panel)
        if (pathname.startsWith('/user') && role === 'admin') {
            return NextResponse.redirect(new URL('/admin', req.url));
        }

        return NextResponse.next();
    } catch (error) {
        if (isApiRoute) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        } else {
            const loginUrl = new URL('/', req.url);
            const response = NextResponse.redirect(loginUrl);
            response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
            response.cookies.set('token', '', { maxAge: 0, path: '/' });
            return response;
        }
    }
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};