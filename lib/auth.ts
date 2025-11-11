import { supabase } from './supabaseClient';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  isAuthenticated: boolean;
}

export interface Account {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
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

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      role: accountData.role,
      isAuthenticated: true,
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

    return {
      id: user.id,
      email: user.email!,
      role: accountData.role,
      isAuthenticated: true,
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