// API client with automatic token refresh
import { signOutAndRedirect } from './auth-client';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  async request<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      // If token expired, try to refresh
      if (response.status === 401) {
        return this.handleTokenExpiry(url, options);
      }

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Request failed' };
      }
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async handleTokenExpiry<T>(
    originalUrl: string,
    originalOptions: RequestInit
  ): Promise<ApiResponse<T>> {
    if (this.isRefreshing) {
      // If already refreshing, queue this request
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        // Token refreshed successfully, retry original request
        this.processQueue(null);

        const retryResponse = await fetch(originalUrl, originalOptions);
        const retryData = await retryResponse.json();

        if (retryResponse.ok) {
          return { success: true, data: retryData };
        } else {
          return { success: false, error: retryData.error || 'Retry failed' };
        }
      } else if (refreshResponse.status === 401) {
        // Refresh token is truly expired/revoked — only now sign out
        this.processQueue(new Error('Token refresh failed'));
        await signOutAndRedirect();
        return { success: false, error: 'Authentication expired' };
      } else {
        // Transient server error — do NOT sign out; surface the error to the caller
        this.processQueue(new Error('Token refresh server error'));
        return { success: false, error: 'Authentication error — please try again' };
      }
    } catch (error) {
      // Network error during refresh — do NOT sign out; user is likely just offline
      this.processQueue(error);
      return { success: false, error: 'Network error — please check your connection' };
    } finally {
      this.isRefreshing = false;
    }
  }

  private processQueue(error: any) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(this.request);
      }
    });

    this.failedQueue = [];
  }
}

export const apiClient = new ApiClient();

// Convenience methods
export const api = {
  get: <T = any>(url: string) => apiClient.request<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, data?: any) => apiClient.request<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }),
  put: <T = any>(url: string, data?: any) => apiClient.request<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }),
  delete: <T = any>(url: string) => apiClient.request<T>(url, { method: 'DELETE' }),
};

/**
 * Drop-in replacement for `fetch` that automatically:
 * 1. Includes credentials (cookies) on every request.
 * 2. On a 401 response, attempts a silent token refresh via /api/auth/refresh
 *    and retries the original request exactly once.
 * 3. If the refresh itself fails (refresh token expired), calls
 *    signOutAndRedirect() so the user is cleanly sent to the login page.
 *
 * Usage: replace `fetch(url, opts)` with `fetchWithAuth(url, opts)`.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const opts: RequestInit = { credentials: 'include', ...options };
  let response = await fetch(url, opts);

  if (response.status !== 401) return response;

  // Access token expired — try one silent refresh
  const refreshRes = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  if (refreshRes.status === 401) {
    // Refresh token is truly expired/revoked — sign out
    await signOutAndRedirect('/');
    // Return the original 401 so any caller that catches errors sees it
    return response;
  }

  if (!refreshRes.ok) {
    // Transient server error during refresh — do NOT sign out; return original response
    return response;
  }

  // Retry with fresh cookies
  response = await fetch(url, opts);
  return response;
}