import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, ACCESS_TOKEN_COOKIE, User } from './auth-server-only';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      // Get access token from cookies or Authorization header
      const authHeader = req.headers.get('Authorization');
      let accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      
      if (!accessToken) {
        accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value || null;
      }
      
      if (!accessToken) {
        return NextResponse.json(
          { error: 'Access token required' },
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
      
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin privileges required' },
          { status: 403 }
        );
      }
      
      // Add user to request object
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = user;
      
      return await handler(authenticatedReq);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export async function withOptionalAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      // Get access token from cookies or Authorization header
      const authHeader = req.headers.get('Authorization');
      let accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      
      if (!accessToken) {
        accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value || null;
      }
      
      const authenticatedReq = req as AuthenticatedRequest;
      
      if (accessToken) {
        const user = await getCurrentUser(accessToken);
        if (user) {
          authenticatedReq.user = user;
        }
      }
      
      return await handler(authenticatedReq);
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // Continue without authentication on error
      return await handler(req as AuthenticatedRequest);
    }
  };
}