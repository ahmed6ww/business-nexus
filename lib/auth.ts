import { db } from '@/db';
import { users, type UserRole } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcrypt';
import { cookies } from 'next/headers';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export async function registerUser({
  name,
  email,
  password,
  role,
}: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash the password
  const hashedPassword = await hash(password, 10);

  // Insert the new user
  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
      role,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  return newUser;
}

export async function authenticateUser(email: string, password: string) {
  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return null;
  }

  // Compare passwords
  const passwordMatch = await compare(password, user.password);
  if (!passwordMatch) {
    return null;
  }

  // Return user without password
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function getUserById(id: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) {
    return null;
  }

  // Return user without password
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

/**
 * Get the current authenticated user from session cookie
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('user_session')?.value;
    
    if (!sessionId) {
      return null;
    }
    
    // Get user data from database using session ID
    return await getUserById(sessionId);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}