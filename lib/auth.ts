// Re-export types and constants for client-side use
export type { User, Profile, TokenPayload, AuthTokens } from './auth-server-only';
export { AUTH_STORAGE_KEY, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth-server-only';

// Re-export server functions for API routes (these will only work on server-side)
export {
  signInWithEmail,
  refreshAccessToken,
  signOut,
  getCurrentUser,
  isUserAuthenticated,
  createAccount,
  findAccountByEmail,
  findAccountById,
  storeRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from './auth-server-only';

// Client-side helper functions (safe for browser)
export const createUser = (user: User): User => user;

export const logoutUser = (): User => ({
  id: '',
  email: '',
  role: 'user',
  isAuthenticated: false,
});

