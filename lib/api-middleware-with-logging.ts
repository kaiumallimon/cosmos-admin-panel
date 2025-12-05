// Enhanced API middleware with system logging for POST, PUT, DELETE operations

import { NextResponse } from 'next/server';
import { getCurrentUser, ACCESS_TOKEN_COOKIE } from './auth-server-only';
import { SystemLogService, extractRequestMetadata } from './system-log-service';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    isAuthenticated: boolean;
    profile?: any;
  };
}

// Handler type definitions
type SingleParamHandler = (req: AuthenticatedRequest) => Promise<Response>;
type TwoParamHandler<T = any> = (req: AuthenticatedRequest, context: T) => Promise<Response>;

export function withAuth<T = any>(
  handler: SingleParamHandler | TwoParamHandler<T>
) {
  return async (request: Request, context?: T) => {
    const startTime = Date.now();
    let response: Response;
    let logData: any = {};
    
    try {
      // Get access token
      const cookieHeader = request.headers.get('cookie');
      const cookies = parseCookies(cookieHeader || '');
      const accessToken = cookies[ACCESS_TOKEN_COOKIE] || cookies['token'];
      
      if (!accessToken) {
        return NextResponse.json({ error: 'Access token required' }, { status: 401 });
      }

      // Get current user
      const user = await getCurrentUser(accessToken);
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      // Create authenticated request object
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;

      // Prepare logging data if this is a logged operation
      const method = request.method as 'POST' | 'PUT' | 'DELETE';
      const shouldLog = ['POST', 'PUT', 'DELETE'].includes(method);
      
      if (shouldLog) {
        const url = new URL(request.url);
        logData = {
          method,
          endpoint: url.pathname,
          ...extractRequestMetadata(request)
        };
        
        // Capture request data for logging (if applicable)
        try {
          if (request.headers.get('content-type')?.includes('application/json')) {
            const requestClone = request.clone();
            logData.request_data = await requestClone.json();
          }
        } catch (e) {
          // Skip if can't parse JSON
        }
      }

      // Execute the handler
      response = context !== undefined 
        ? await (handler as TwoParamHandler)(authenticatedRequest, context)
        : await (handler as SingleParamHandler)(authenticatedRequest);
      
      // Log successful operations
      if (shouldLog && response.status >= 200 && response.status < 400) {
        const duration = Date.now() - startTime;
        
        // Try to get response data for logging
        let responseData: any = null;
        try {
          if (response.headers.get('content-type')?.includes('application/json')) {
            const responseClone = response.clone();
            responseData = await responseClone.json();
          }
        } catch (e) {
          // Skip if can't parse response
        }
        
        // Extract resource ID from URL or response
        const resourceId = extractResourceId(logData.endpoint, responseData);
        
        await SystemLogService.logAction(user, method, logData.endpoint, {
          resource_id: resourceId,
          request_data: logData.request_data,
          response_status: response.status,
          ip_address: logData.ip_address,
          user_agent: logData.user_agent,
          duration_ms: duration,
          success: true,
          after_data: responseData?.data || responseData
        });
      }

      return response;
      
    } catch (error: any) {
      console.error('API middleware error:', error);
      
      const duration = Date.now() - startTime;
      const errorResponse = NextResponse.json(
        { error: error.message || 'Internal server error' }, 
        { status: error.status || 500 }
      );
      
      // Log failed operations
      if (logData.method && ['POST', 'PUT', 'DELETE'].includes(logData.method)) {
        try {
          // Get user from token if available for error logging
          const cookieHeader = request.headers.get('cookie');
          const cookies = parseCookies(cookieHeader || '');
          const accessToken = cookies[ACCESS_TOKEN_COOKIE] || cookies['token'];
          
          if (accessToken) {
            const user = await getCurrentUser(accessToken);
            if (user) {
              await SystemLogService.logAction(user, logData.method, logData.endpoint, {
                request_data: logData.request_data,
                response_status: errorResponse.status,
                ip_address: logData.ip_address,
                user_agent: logData.user_agent,
                duration_ms: duration,
                success: false,
                error_message: error.message || 'Internal server error'
              });
            }
          }
        } catch (logError) {
          console.error('Failed to log error:', logError);
        }
      }
      
      return errorResponse;
    }
  };
}

// Helper function to parse cookies from cookie header
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  
  return cookies;
}

// Helper function to extract resource ID from URL path or response
function extractResourceId(endpoint: string, responseData: any): string | undefined {
  // Try to extract ID from URL path (e.g., /api/users/123 -> 123)
  const pathParts = endpoint.split('/');
  const lastPart = pathParts[pathParts.length - 1];
  
  // Check if last part looks like an ID (UUID, number, or alphanumeric)
  if (lastPart && (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastPart) || // UUID
    /^\d+$/.test(lastPart) || // Number
    /^[a-zA-Z0-9_-]+$/.test(lastPart) // Alphanumeric ID
  )) {
    return lastPart;
  }
  
  // Try to extract from response data
  if (responseData?.data?.id) return responseData.data.id;
  if (responseData?.id) return responseData.id;
  if (responseData?.data?._id) return responseData.data._id?.toString();
  if (responseData?._id) return responseData._id?.toString();
  
  return undefined;
}