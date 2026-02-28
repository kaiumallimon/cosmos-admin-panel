import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, logoutUser, AUTH_STORAGE_KEY } from '@/lib/auth-client';

// ── Proactive token refresh ────────────────────────────────────────────────────
// Decode a JWT payload without verifying the signature (client-safe).
function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { exp?: number };
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

let _refreshTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedule a silent token refresh ~60 s before the access token expires.
 * Clears any previously scheduled timer first.
 */
function scheduleProactiveRefresh(
  accessToken: string,
  refreshFn: () => Promise<void>
) {
  if (_refreshTimer) clearTimeout(_refreshTimer);

  const exp = decodeJwtExp(accessToken);
  if (!exp) return;

  const msUntilExpiry = exp * 1000 - Date.now();
  const refreshIn = Math.max(msUntilExpiry - 60_000, 0); // 60 s before expiry

  _refreshTimer = setTimeout(refreshFn, refreshIn);
}

// ─────────────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  isUserAuthenticated: () => boolean;
  silentRefresh: () => Promise<boolean>;
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const result = await response.json();

          if (response.ok && result.success && result.user) {
            console.log("Auth store: Login successful, setting user:", result.user);
            set({ user: result.user, isLoading: false });
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: result.user }));
            document.cookie = `auth-session=${JSON.stringify({ user: result.user })}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;

            // Schedule a proactive refresh before the access token expires
            if (result.tokens?.accessToken) {
              scheduleProactiveRefresh(result.tokens.accessToken, async () => { await get().silentRefresh(); });
            }

            return { success: true, role: result.user.role };
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
          if (_refreshTimer) { clearTimeout(_refreshTimer); _refreshTimer = null; }
          console.log("Auth store: Starting logout process...");
          await fetch('/api/auth/logout', { method: 'POST' });
          const user = logoutUser();
          set({ user, isLoading: false });
          localStorage.removeItem(AUTH_STORAGE_KEY);
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

      isUserAuthenticated: () => {
        const user = get().user;
        return user.isAuthenticated && user.role === 'user';
      },

      /**
       * Silently exchange the refresh-token cookie for a new access token.
       * Returns true on success, false when the refresh token is also expired
       * (at which point the user must log in again).
       */
      silentRefresh: async (): Promise<boolean> => {
        try {
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });

          if (!refreshResponse.ok) {
            console.log("Auth store: Refresh token expired, logging out");
            const user = logoutUser();
            set({ user });
            localStorage.removeItem(AUTH_STORAGE_KEY);
            document.cookie = 'auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            return false;
          }

          const data = await refreshResponse.json();

          // Re-fetch the current user so profile stays up-to-date
          const meResponse = await fetch('/api/auth/me', { credentials: 'include' });
          if (meResponse.ok) {
            const meData = await meResponse.json();
            if (meData.success && meData.user) {
              set({ user: meData.user });
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: meData.user }));
              document.cookie = `auth-session=${JSON.stringify({ user: meData.user })}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
            }
          }

          // Schedule the next proactive refresh
          if (data.accessToken) {
            scheduleProactiveRefresh(data.accessToken, async () => { await get().silentRefresh(); });
          }

          console.log("Auth store: Token refreshed silently");
          return true;
        } catch (error) {
          console.error('Auth store: silentRefresh error:', error);
          // Network error — don't log the user out; they're probably just offline
          return false;
        }
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
            if (result.success && result.user) {
              console.log("Auth store: Found authenticated user:", result.user.email, 'role:', result.user.role);
              set({ user: result.user });
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: result.user }));
              document.cookie = `auth-session=${JSON.stringify({ user: result.user })}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;

              // We don't have the raw access token here, but schedule via silentRefresh
              // which will set a new timer internally — fire it 14 min from now as a
              // conservative estimate (access tokens last 15 min).
              if (_refreshTimer) clearTimeout(_refreshTimer);
              _refreshTimer = setTimeout(() => get().silentRefresh(), 14 * 60 * 1000);
            } else {
              console.log("Auth store: No authenticated user found");
              const user = logoutUser();
              set({ user });
            }
          } else if (response.status === 401) {
            // Access token expired — try to refresh
            const refreshed = await get().silentRefresh();
            if (!refreshed) {
              console.log("Auth store: Could not refresh — user logged out");
            }
          } else {
            // Unexpected server error — do NOT log the user out; keep existing state
            console.warn("Auth store: Unexpected status from /api/auth/me:", response.status);
          }
        } catch (error) {
          // Network error (offline etc.) — keep existing Zustand state, don't log out
          console.error('Auth store: Error initializing auth (network?):', error);
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