'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { registerUser, authenticateUser } from '../auth';
import { LoginRequest, RegistrationRequest } from '../types';
import { redirect } from 'next/navigation';

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

    // Set a session cookie (in a real app, you'd want to use a proper session management solution)
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'user_session',
      value: user.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: oneWeek,
      path: '/',
    });

    // Return success response
    return {
      success: true,
      user,
    };
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
  const cookieStore = await cookies();
  cookieStore.delete('user_session');
  revalidatePath('/');
  redirect('/login');
}