import { supabase } from './supabaseClient';

export const getCurrentSessionToken = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }
    
    return session.access_token;
  } catch (error) {
    console.error('Error getting session token:', error);
    return null;
  }
};

// Helper function to get token from cookies
const getTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'token') {
      return value;
    }
  }
  return null;
};

export const makeAuthenticatedRequest = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  // Try to get token from different sources in order of preference
  let token = localStorage.getItem('token') || getTokenFromCookie();
  
  // Fallback to Supabase session token if other methods fail
  if (!token) {
    token = await getCurrentSessionToken();
  }
  
  if (!token) {
    throw new Error('No authentication token available. Please log in again.');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
};