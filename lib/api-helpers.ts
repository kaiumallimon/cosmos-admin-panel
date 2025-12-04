import { AUTH_STORAGE_KEY } from './auth-client';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Helper function to get access token from localStorage
const getTokenFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authData) return null;
    
    const parsed = JSON.parse(authData);
    return parsed.accessToken || null;
  } catch (error) {
    console.error('Error getting token from localStorage:', error);
    return null;
  }
};

// Helper function to update token in localStorage
const updateTokenInStorage = (newToken: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authData) {
      const parsed = JSON.parse(authData);
      parsed.accessToken = newToken;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
    }
  } catch (error) {
    console.error('Error updating token in localStorage:', error);
  }
};

// Helper function to get token from cookies
const getTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'accessToken') {
      return decodeURIComponent(value);
    }
  }
  return null;
};

// Helper function to refresh the access token
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Include refresh token cookie
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.accessToken) {
        // Update token in localStorage
        updateTokenInStorage(data.accessToken);
        return true;
      }
    }

    // If refresh fails, clear auth data and redirect to login
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear auth data and redirect to login
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return false;
  }
};

// Check if the error indicates an expired/invalid token
const isTokenError = (response: Response, data?: any): boolean => {
  if (response.status === 401) {
    if (data?.error) {
      const errorMessage = data.error.toLowerCase();
      return errorMessage.includes('token') && 
             (errorMessage.includes('expired') || 
              errorMessage.includes('invalid') ||
              errorMessage.includes('required'));
    }
    return true; // Assume 401 is token-related
  }
  return false;
};

export const makeAuthenticatedRequest = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  // Try to get token from different sources in order of preference
  let token = getTokenFromStorage() || getTokenFromCookie();
  
  const makeRequest = async (authToken?: string): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };
    
    // Add Authorization header if token is available
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return fetch(url, {
      credentials: 'include', // Always include cookies for fallback auth
      ...options,
      headers,
    });
  };

  // Make initial request
  let response = await makeRequest(token || undefined);
  
  // Check if the response indicates a token error
  if (response.status === 401 || response.status === 403) {
    try {
      const responseData = await response.clone().json();
      
      if (isTokenError(response, responseData)) {
        console.log('Token expired, attempting refresh...');
        
        // If already refreshing, wait for the ongoing refresh
        if (isRefreshing) {
          if (refreshPromise) {
            const refreshSuccess = await refreshPromise;
            if (refreshSuccess) {
              // Get the new token and retry the request
              const newToken = getTokenFromStorage();
              return makeRequest(newToken || undefined);
            }
          }
          return response;
        }
        
        // Start refresh process
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
        
        const refreshSuccess = await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;
        
        if (refreshSuccess) {
          console.log('Token refreshed successfully, retrying request...');
          // Get the new token and retry the request
          const newToken = getTokenFromStorage();
          return makeRequest(newToken || undefined);
        } else {
          console.log('Token refresh failed, redirecting to login...');
        }
      }
    } catch (error) {
      console.error('Error parsing response or refreshing token:', error);
    }
  }
  
  return response;
};

// Convenience wrapper that automatically parses JSON responses
export const makeAuthenticatedJsonRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await makeAuthenticatedRequest(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = await response.text() || errorMessage;
      }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network request failed' };
  }
};