import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, signInWithEmail, signOut, getCurrentUser, logoutUser, AUTH_STORAGE_KEY } from '@/lib/auth';

interface AuthState {
  user: User;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: {
        id: '',
        email: '',
        role: 'user',
        isAuthenticated: false,
      },
      isLoading: false,
      
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          console.log("Auth store: Starting Supabase login process...");
          
          const result = await signInWithEmail(email, password);
          
          if (result.success && result.user) {
            console.log("Auth store: Login successful, setting user:", result.user);
            
            // Update Zustand state
            set({ user: result.user, isLoading: false });
            
            // Store auth data in localStorage for consistency
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: result.user }));
            console.log("Auth store: Stored in localStorage");
            
            // Set session cookie for middleware access
            document.cookie = `auth-session=${JSON.stringify({ user: result.user })}; path=/; max-age=3600; SameSite=Lax`;
            console.log("Auth store: Set session cookie");

            // Also set `token` cookie (used by middleware) to the Supabase access token if available.
            // If the token wasn't returned, fall back to the user id to avoid immediate redirect loops.
            try {
              const tokenValue = (result as any).token ?? result.user.id;
              document.cookie = `token=${tokenValue}; path=/; max-age=3600; SameSite=Lax`;
              console.log("Auth store: Set token cookie");
            } catch (e) {
              console.warn('Auth store: Could not set token cookie', e);
            }
            
            return { success: true };
          } else {
            console.log("Auth store: Login failed:", result.error);
            set({ isLoading: false });
            return { success: false, error: result.error };
          }
        } catch (error) {
          console.error('Auth store: Login error:', error);
          set({ isLoading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },
      
      logout: async () => {
        try {
          console.log("Auth store: Starting logout process...");
          
          // Sign out from Supabase
          await signOut();
          
          // Clear local state
          const user = logoutUser();
          set({ user, isLoading: false });
          
          // Clear auth data from localStorage
          localStorage.removeItem(AUTH_STORAGE_KEY);
          
          // Clear session cookie
          document.cookie = 'auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          console.log("Auth store: Logout completed");
        } catch (error) {
          console.error('Auth store: Logout error:', error);
        }
      },
      
      isAuthenticated: () => {
        const user = get().user;
        return user.isAuthenticated && user.role === 'admin';
      },
      
      initializeAuth: async () => {
        try {
          console.log("Auth store: Initializing auth...");
          const currentUser = await getCurrentUser();
          
          if (currentUser && currentUser.role === 'admin') {
            console.log("Auth store: Found authenticated admin user:", currentUser.email);
            set({ user: currentUser });
            
            // Update localStorage and cookie
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: currentUser }));
            document.cookie = `auth-session=${JSON.stringify({ user: currentUser })}; path=/; max-age=3600; SameSite=Lax`;
          } else {
            console.log("Auth store: No authenticated admin user found");
            const user = logoutUser();
            set({ user });
          }
        } catch (error) {
          console.error('Auth store: Error initializing auth:', error);
          const user = logoutUser();
          set({ user });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
      skipHydration: false,
    }
  )
);