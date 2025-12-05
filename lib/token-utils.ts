import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || 'your-reset-token-secret';

// Token expiration times
const RESET_TOKEN_EXPIRES_IN = '3m'; // 3 minutes
const ACCESS_TOKEN_EXPIRES_IN = '24h';

export interface PasswordResetTokenPayload {
  userId: string;
  email: string;
  type: 'password-reset';
  iat?: number;
  exp?: number;
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access';
  iat?: number;
  exp?: number;
}

/**
 * Generate a password reset token (expires in 3 minutes, non-refreshable)
 */
export function generatePasswordResetToken(userId: string, email: string): string {
  const payload: PasswordResetTokenPayload = {
    userId,
    email,
    type: 'password-reset'
  };

  return jwt.sign(payload, RESET_TOKEN_SECRET, {
    expiresIn: RESET_TOKEN_EXPIRES_IN,
    issuer: 'cosmos-admin',
    audience: 'password-reset'
  });
}

/**
 * Verify and decode a password reset token
 */
export function verifyPasswordResetToken(token: string): PasswordResetTokenPayload | null {
  try {
    const decoded = jwt.verify(token, RESET_TOKEN_SECRET, {
      issuer: 'cosmos-admin',
      audience: 'password-reset'
    }) as PasswordResetTokenPayload;

    // Additional validation
    if (decoded.type !== 'password-reset') {
      console.error('Invalid token type:', decoded.type);
      return null;
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Password reset token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid password reset token');
    } else {
      console.error('Password reset token verification error:', error);
    }
    return null;
  }
}

/**
 * Generate an access token for regular authentication
 */
export function generateAccessToken(userId: string, email: string, role: string): string {
  const payload: AccessTokenPayload = {
    userId,
    email,
    role,
    type: 'access'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    issuer: 'cosmos-admin',
    audience: 'admin-panel'
  });
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'cosmos-admin',
      audience: 'admin-panel'
    }) as AccessTokenPayload;

    // Additional validation
    if (decoded.type !== 'access') {
      console.error('Invalid token type:', decoded.type);
      return null;
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid access token');
    } else {
      console.error('Access token verification error:', error);
    }
    return null;
  }
}

/**
 * Get the remaining time for a token in minutes
 */
export function getTokenRemainingTime(token: string): number {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return 0;

    const now = Math.floor(Date.now() / 1000);
    const remainingSeconds = decoded.exp - now;
    
    return Math.max(0, Math.floor(remainingSeconds / 60));
  } catch (error) {
    console.error('Error getting token remaining time:', error);
    return 0;
  }
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Create a password reset URL
 */
export function createPasswordResetUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}