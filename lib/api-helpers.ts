import { AUTH_STORAGE_KEY } from './auth-client';

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

export const makeAuthenticatedRequest = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  // Try to get token from different sources in order of preference
  let token = getTokenFromStorage() || getTokenFromCookie();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  // Add Authorization header if token is available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    credentials: 'include', // Always include cookies for fallback auth
    ...options,
    headers,
  });
};