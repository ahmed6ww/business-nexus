import jwt from 'jsonwebtoken';
import { UserRole } from '@/db/schema';

// Secret key for JWT signing - in production, use an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = '7d'; // 1 week expiration

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

/**
 * Creates a JWT token with the provided user information
 */
export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN 
  });
}

/**
 * Verifies a JWT token and returns the decoded payload
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Parse the JWT token from the Authorization header or cookie
 */
export function parseToken(authHeader: string | undefined, cookieToken?: string): string | null {
  // Try to get token from Authorization header
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // If no valid Authorization header, try to get it from the cookie
  if (cookieToken) {
    return cookieToken;
  }
  
  return null;
}