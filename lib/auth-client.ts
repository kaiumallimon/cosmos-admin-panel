// Client-side auth utilities (no MongoDB dependencies)
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  isAuthenticated: boolean;
  profile?: Profile;
}

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  avatar_url: string;
  created_at: string;
  full_name: string | null;
  role: 'student' | 'admin';
  student_id: string | null;
  department: string | null;
  batch: string | null;
  program: string | null;
  completed_credits: number | null;
  cgpa: number | null;
  current_trimester: string | null;
  trimester_credits: number | null;
}

// Constants
export const AUTH_STORAGE_KEY = "cosmosAuthData";
export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

// Client-side helper functions
export const createUser = (user: User): User => user;

export const logoutUser = (): User => ({
  id: '',
  email: '',
  role: 'user',
  isAuthenticated: false,
});

// Sign out and redirect helper for client-side
export const signOutAndRedirect = async (redirectTo = '/') : Promise<void> => {
  try {
    // Call logout API
    await fetch('/api/auth/logout', {
      method: 'POST',
    });
  } catch (e) {
    console.warn('Auth: API logout failed', e);
  }

  // Clear local client-side auth storage
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      // Clear cookies used by middleware/store
      document.cookie = 'auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `${REFRESH_TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      // Redirect to login page
      window.location.href = redirectTo;
    }
  } catch (e) {
    console.warn('Auth: failed to clear client storage or redirect', e);
  }
};