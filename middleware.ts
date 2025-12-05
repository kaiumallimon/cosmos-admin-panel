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

    // For now, we'll just check if the token exists
    // The actual JWT verification will happen in the API routes
    // to avoid issues with crypto in edge runtime
    try {
        // Simple validation - check if it looks like a JWT
        const parts = accessToken.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }
        
        return NextResponse.next();
    } catch (error) {
        if (isApiRoute) {
            // Return JSON error for API routes
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        } else {
            // Token is invalid, redirect to login for browser requests
            const loginUrl = new URL('/', req.url);
            const response = NextResponse.redirect(loginUrl);
            
            // Clear invalid tokens
            response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
            response.cookies.set('token', '', { maxAge: 0, path: '/' });
            
            return response;
        }
    }
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};