import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, logoutUser, AUTH_STORAGE_KEY } from '@/lib/auth-client';

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
          console.log("Auth store: Starting MongoDB login process...");
          
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          const result = await response.json();
          
          if (response.ok && result.success && result.user) {
            console.log("Auth store: Login successful, setting user:", result.user);
            
            // Update Zustand state
            set({ user: result.user, isLoading: false });
            
            // Store auth data in localStorage for consistency
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: result.user }));
            console.log("Auth store: Stored in localStorage");
            
            // Set session cookie for middleware access
            document.cookie = `auth-session=${JSON.stringify({ user: result.user })}; path=/; max-age=3600; SameSite=Lax`;
            console.log("Auth store: Set session cookie");
            
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
          
          // Call logout API
          await fetch('/api/auth/logout', {
            method: 'POST',
          });
          
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
          
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include',
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.user && result.user.role === 'admin') {
              console.log("Auth store: Found authenticated admin user:", result.user.email);
              set({ user: result.user });
              
              // Update localStorage and cookie
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: result.user }));
              document.cookie = `auth-session=${JSON.stringify({ user: result.user })}; path=/; max-age=3600; SameSite=Lax`;
            } else {
              console.log("Auth store: No authenticated admin user found");
              const user = logoutUser();
              set({ user });
            }
          } else if (response.status === 401) {
            // Token might be expired, try to refresh
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include',
            });
            
            if (refreshResponse.ok) {
              // Retry getting user after refresh
              const retryResponse = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
              });
              
              if (retryResponse.ok) {
                const retryResult = await retryResponse.json();
                if (retryResult.success && retryResult.user && retryResult.user.role === 'admin') {
                  console.log("Auth store: Found authenticated admin user after refresh:", retryResult.user.email);
                  set({ user: retryResult.user });
                  
                  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: retryResult.user }));
                  document.cookie = `auth-session=${JSON.stringify({ user: retryResult.user })}; path=/; max-age=3600; SameSite=Lax`;
                  return;
                }
              }
            }
            
            console.log("Auth store: No authenticated admin user found");
            const user = logoutUser();
            set({ user });
          } else {
            console.log("Auth store: Error checking authentication");
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