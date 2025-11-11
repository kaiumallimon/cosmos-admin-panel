import { supabase } from './supabaseClient';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  isAuthenticated: boolean;
  profile?: Profile;
}

export interface Account {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
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

export const AUTH_STORAGE_KEY = "cosmosAuthData";

export const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> => {
  try {
    console.log("Auth: Attempting Supabase sign in...");
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Auth: Supabase sign in error:", error);
      return { success: false, error: error.message };
    }

    if (!data.user) {
      console.error("Auth: No user data returned");
      return { success: false, error: 'Authentication failed' };
    }

    // Extract access token from session if available
    const token = (data as any).session?.access_token ?? undefined;

    // Check if user exists in accounts table and get their role
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (accountError || !accountData) {
      console.error("Auth: Account not found in accounts table");
      return { success: false, error: 'Access restricted - account not found' };
    }

    // Only allow admin users to login
    if (accountData.role !== 'admin') {
      console.error("Auth: User is not admin, access restricted");
      return { success: false, error: 'Access restricted - admin privileges required' };
    }

    // Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profile')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error("Auth: Profile fetch error:", profileError);
      // Maybe allow login without profile, or return error
      // For now, allow but log
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      role: accountData.role,
      isAuthenticated: true,
      profile: profileData || undefined,
    };

    console.log("Auth: Login successful for admin user:", user.email);
    return { success: true, user, token };
  } catch (error) {
    console.error("Auth: Unexpected error during sign in:", error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Auth: Sign out error:", error);
    }
  } catch (error) {
    console.error("Auth: Unexpected error during sign out:", error);
  }
};

/**
 * Sign out and redirect the user to the login page ('/').
 * This clears localStorage and client-side cookies used by the app and then
 * performs a client-side redirect. Use this on any client action that needs
 * to sign the user out and take them to the login page.
 */
export const signOutAndRedirect = async (redirectTo = '/') : Promise<void> => {
  try {
    // Sign out from Supabase
    await signOut();
  } catch (e) {
    console.warn('Auth: signOut failed', e);
  }

  // Clear local client-side auth storage
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      // Clear cookies used by middleware/store
      document.cookie = 'auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      // Redirect to login page
      window.location.href = redirectTo;
    }
  } catch (e) {
    console.warn('Auth: failed to clear client storage or redirect', e);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Get user role from accounts table
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .single();

    if (accountError || !accountData) {
      return null;
    }

    // Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profile')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email!,
      role: accountData.role,
      isAuthenticated: true,
      profile: profileData || undefined,
    };
  } catch (error) {
    console.error("Auth: Error getting current user:", error);
    return null;
  }
};

export const isUserAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null && user.role === 'admin';
};

export const createUser = (user: User): User => user;

export const logoutUser = (): User => ({
  id: '',
  email: '',
  role: 'user',
  isAuthenticated: false,
});