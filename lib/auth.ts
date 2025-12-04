import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getCollection } from './mongodb';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be provided in environment variables');
}

// Interfaces
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  isAuthenticated: boolean;
  profile?: Profile;
}

export interface Account {
  _id?: any;
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  created_at: Date;
  updated_at: Date;
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

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshToken {
  _id?: any;
  userId: string;
  token: string;
  created_at: Date;
  expires_at: Date;
  is_revoked: boolean;
}

// Constants
export const AUTH_STORAGE_KEY = "cosmosAuthData";
export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

// Helper functions
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded.type === 'access' ? decoded : null;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    return decoded.type === 'refresh' ? decoded : null;
  } catch (error) {
    return null;
  }
}

// Database operations
export async function createAccount(email: string, password: string, role: 'admin' | 'user' = 'user'): Promise<Account> {
  const accountsCollection = await getCollection<Account>('accounts');
  
  // Check if user already exists
  const existingAccount = await accountsCollection.findOne({ email });
  if (existingAccount) {
    throw new Error('Account with this email already exists');
  }
  
  const hashedPassword = await hashPassword(password);
  const account: Account = {
    id: uuidv4(),
    email,
    password: hashedPassword,
    role,
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  await accountsCollection.insertOne(account);
  return account;
}

export async function findAccountByEmail(email: string): Promise<Account | null> {
  const accountsCollection = await getCollection<Account>('accounts');
  return accountsCollection.findOne({ email });
}

export async function findAccountById(id: string): Promise<Account | null> {
  const accountsCollection = await getCollection<Account>('accounts');
  return accountsCollection.findOne({ id });
}

export async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const refreshTokensCollection = await getCollection<RefreshToken>('refresh_tokens');
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  
  const refreshToken: RefreshToken = {
    userId,
    token,
    created_at: new Date(),
    expires_at: expiresAt,
    is_revoked: false,
  };
  
  await refreshTokensCollection.insertOne(refreshToken);
}

export async function findRefreshToken(token: string): Promise<RefreshToken | null> {
  const refreshTokensCollection = await getCollection<RefreshToken>('refresh_tokens');
  return refreshTokensCollection.findOne({ 
    token, 
    is_revoked: false,
    expires_at: { $gt: new Date() }
  });
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const refreshTokensCollection = await getCollection<RefreshToken>('refresh_tokens');
  await refreshTokensCollection.updateOne(
    { token },
    { $set: { is_revoked: true, updated_at: new Date() } }
  );
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  const refreshTokensCollection = await getCollection<RefreshToken>('refresh_tokens');
  await refreshTokensCollection.updateMany(
    { userId },
    { $set: { is_revoked: true, updated_at: new Date() } }
  );
}

// Authentication functions
export const signInWithEmail = async (email: string, password: string): Promise<{
  success: boolean;
  user?: User;
  tokens?: AuthTokens;
  error?: string;
}> => {
  try {
    console.log("Auth: Attempting MongoDB sign in...");
    
    // Find account by email
    const account = await findAccountByEmail(email);
    if (!account) {
      console.error("Auth: Account not found");
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, account.password);
    if (!isPasswordValid) {
      console.error("Auth: Invalid password");
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Only allow admin users to login
    if (account.role !== 'admin') {
      console.error("Auth: User is not admin, access restricted");
      return { success: false, error: 'Access restricted - admin privileges required' };
    }
    
    // Generate tokens
    const tokenPayload = {
      userId: account.id,
      email: account.email,
      role: account.role,
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    
    // Store refresh token in database
    await storeRefreshToken(account.id, refreshToken);
    
    // Fetch profile data (if exists)
    let profileData: Profile | undefined;
    try {
      const profilesCollection = await getCollection<Profile>('profiles');
      profileData = await profilesCollection.findOne({ id: account.id }) || undefined;
    } catch (error) {
      console.error("Auth: Profile fetch error:", error);
    }
    
    const user: User = {
      id: account.id,
      email: account.email,
      role: account.role,
      isAuthenticated: true,
      profile: profileData,
    };
    
    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
    };
    
    console.log("Auth: Login successful for admin user:", user.email);
    return { success: true, user, tokens };
  } catch (error) {
    console.error("Auth: Unexpected error during sign in:", error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

export async function refreshAccessToken(refreshToken: string): Promise<{
  success: boolean;
  tokens?: AuthTokens;
  error?: string;
}> {
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return { success: false, error: 'Invalid refresh token' };
    }
    
    // Check if refresh token exists in database
    const storedToken = await findRefreshToken(refreshToken);
    if (!storedToken) {
      return { success: false, error: 'Refresh token not found or expired' };
    }
    
    // Get account
    const account = await findAccountById(payload.userId);
    if (!account || account.role !== 'admin') {
      return { success: false, error: 'Account not found or access restricted' };
    }
    
    // Generate new tokens
    const tokenPayload = {
      userId: account.id,
      email: account.email,
      role: account.role,
    };
    
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    
    // Revoke old refresh token and store new one
    await revokeRefreshToken(refreshToken);
    await storeRefreshToken(account.id, newRefreshToken);
    
    const tokens: AuthTokens = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
    
    return { success: true, tokens };
  } catch (error) {
    console.error("Auth: Error refreshing token:", error);
    return { success: false, error: 'Failed to refresh token' };
  }
}

export async function signOut(refreshToken?: string): Promise<void> {
  try {
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
  } catch (error) {
    console.error("Auth: Error during sign out:", error);
  }
}

/**
 * Sign out and redirect the user to the login page ('/').
 * This clears localStorage and client-side cookies used by the app and then
 * performs a client-side redirect. Use this on any client action that needs
 * to sign the user out and take them to the login page.
 */
export const signOutAndRedirect = async (redirectTo = '/') : Promise<void> => {
  try {
    // Get refresh token from localStorage or cookies
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    let refreshToken = null;
    if (authData) {
      const parsed = JSON.parse(authData);
      refreshToken = parsed.refreshToken;
    }
    
    // Sign out with refresh token
    await signOut(refreshToken);
  } catch (e) {
    console.warn('Auth: signOut failed', e);
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

export const getCurrentUser = async (accessToken: string): Promise<User | null> => {
  try {
    if (!accessToken) {
      return null;
    }
    
    // Verify access token
    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return null;
    }
    
    // Get account
    const account = await findAccountById(payload.userId);
    if (!account) {
      return null;
    }
    
    // Fetch profile data
    let profileData: Profile | undefined;
    try {
      const profilesCollection = await getCollection<Profile>('profiles');
      profileData = await profilesCollection.findOne({ id: account.id }) || undefined;
    } catch (error) {
      console.error("Auth: Profile fetch error:", error);
    }
    
    return {
      id: account.id,
      email: account.email,
      role: account.role,
      isAuthenticated: true,
      profile: profileData,
    };
  } catch (error) {
    console.error("Auth: Error getting current user:", error);
    return null;
  }
};

export const isUserAuthenticated = async (accessToken: string): Promise<boolean> => {
  const user = await getCurrentUser(accessToken);
  return user !== null && user.role === 'admin';
};

export const createUser = (user: User): User => user;

export const logoutUser = (): User => ({
  id: '',
  email: '',
  role: 'user',
  isAuthenticated: false,
});

