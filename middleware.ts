import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow public and static paths
        const isPublicPath = pathname === '/' || pathname.startsWith('/public') || pathname.startsWith('/api/') || pathname.startsWith('/_next/static') || pathname === '/login' || pathname === "/favicon.ico";

    if (isPublicPath)  return NextResponse.next();

    // Read token cookie name used
    const token = req.cookies.get("token")?.value;

    if(!token){
        // Redirect to login if no token found
            // Redirect to login (root '/') if no token found. Root is the login page in this app.
        const loginUrl = new URL('/', req.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};