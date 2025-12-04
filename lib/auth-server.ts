// Server-side authentication helpers that can use next/headers
import { cookies } from 'next/headers';
import { getCurrentUser, ACCESS_TOKEN_COOKIE, User } from './auth-server-only';

export async function getCurrentUserServer(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    
    if (!accessToken) {
      return null;
    }
    
    return await getCurrentUser(accessToken);
  } catch (error) {
    console.error("Server auth: Error getting current user:", error);
    return null;
  }
}

export async function isUserAuthenticatedServer(): Promise<boolean> {
  const user = await getCurrentUserServer();
  return user !== null && user.role === 'admin';
}