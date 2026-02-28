import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, ACCESS_TOKEN_COOKIE, User } from './auth-server-only';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

// Type for handlers with no params
type SingleParamHandler = (req: AuthenticatedRequest) => Promise<NextResponse>;

// Type for handlers with params (like [id] routes)
type TwoParamHandler = (req: AuthenticatedRequest, context: any) => Promise<NextResponse>;

export function withAuth<T = any>(
  handler: SingleParamHandler | TwoParamHandler
): (req: NextRequest, context?: T) => Promise<NextResponse> {
  return async (req: NextRequest, context?: T): Promise<NextResponse> => {
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

      // Check if handler expects two parameters (for routes with params)
      if (context !== undefined) {
        return (handler as TwoParamHandler)(authenticatedReq, context);
      } else {
        return (handler as SingleParamHandler)(authenticatedReq);
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Like withAuth but allows any authenticated user (not just admins)
export function withAnyAuth<T = any>(
  handler: SingleParamHandler | TwoParamHandler
): (req: NextRequest, context?: T) => Promise<NextResponse> {
  return async (req: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('Authorization');
      let accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (!accessToken) {
        accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value || null;
      }

      if (!accessToken) {
        return NextResponse.json({ error: 'Access token required' }, { status: 401 });
      }

      const user = await getCurrentUser(accessToken);

      if (!user) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = user;

      if (context !== undefined) {
        return (handler as TwoParamHandler)(authenticatedReq, context);
      } else {
        return (handler as SingleParamHandler)(authenticatedReq);
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

export function withOptionalAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
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

      return handler(authenticatedReq);
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // Continue without authentication on error
      return handler(req as AuthenticatedRequest);
    }
  };
}