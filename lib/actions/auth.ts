'use server';

import { revalidatePath } from 'next/cache';
import { registerUser, authenticateUser } from '../auth';
import { LoginRequest, RegistrationRequest } from '../types';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authOptions } from '../auth.config';
import { getServerSession } from 'next-auth';

/**
 * Server action to register a new user
 */
export async function registerAction(formData: RegistrationRequest) {
  try {
    // Check if all required fields are provided
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      return {
        success: false,
        error: 'Missing required fields',
      };
    }

    // Register the user
    const user = await registerUser(formData);

    // Return success response
    return {
      success: true,
      user,
    };
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error && error.message === 'User with this email already exists') {
      return {
        success: false,
        error: error.message,
      };
    }

    // Handle any other errors
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Failed to register user',
    };
  }
}

/**
 * Server action to authenticate a user and establish a session
 */
export async function loginAction(formData: LoginRequest) {
  try {
    // Check if email and password are provided
    if (!formData.email || !formData.password) {
      return {
        success: false,
        error: 'Email and password are required',
      };
    }

    // Authenticate the user
    const user = await authenticateUser(formData.email, formData.password);

    // Check if authentication was successful
    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // For NextAuth to handle the session, we need to redirect to the sign-in callback
    // Using a server action, we'll pass callbackUrl to redirect properly after auth
    redirect(`/api/auth/callback/credentials?email=${encodeURIComponent(formData.email)}&password=${encodeURIComponent(formData.password)}`);
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Failed to authenticate',
    };
  }
}

/**
 * Server action to log out a user
 */
export async function logoutAction() {
  // Using NextAuth's signOut in server components requires a different approach
  // We'll manually clear session cookies
  const cookieStore = await cookies();
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('next-auth.csrf-token');
  cookieStore.delete('next-auth.callback-url');
  
  revalidatePath('/');
  redirect('/login');
}