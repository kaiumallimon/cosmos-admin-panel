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
      } else {
        // Refresh failed, logout user
        this.processQueue(new Error('Token refresh failed'));
        await signOutAndRedirect();
        return { success: false, error: 'Authentication expired' };
      }
    } catch (error) {
      this.processQueue(error);
      await signOutAndRedirect();
      return { success: false, error: 'Authentication error' };
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