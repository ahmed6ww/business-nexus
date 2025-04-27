import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// This middleware function runs on every request
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define which paths are accessible only to logged in users
  const isPrivatePath = 
    path.startsWith('/dashboard') || 
    path.startsWith('/profile');
  
  // Define which paths are only accessible to logged out users
  const isAuthPath = 
    path.startsWith('/login') || 
    path.startsWith('/register');
  
  // Check for JWT token via Auth.js
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;
  
  // If trying to access private routes without being logged in,
  // redirect to login page
  if (isPrivatePath && !isLoggedIn) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }
  
  // If trying to access login/register pages while logged in,
  // redirect to dashboard
  if (isAuthPath && isLoggedIn) {
    if (token?.role === 'entrepreneur') {
      return NextResponse.redirect(new URL('/dashboard/entrepreneur', request.url));
    } else if (token?.role === 'investor') {
      return NextResponse.redirect(new URL('/dashboard/investor', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // If trying to access the main dashboard route, redirect to role-specific dashboard
  if (path === '/dashboard' && isLoggedIn) {
    if (token?.role === 'entrepreneur') {
      return NextResponse.redirect(new URL('/dashboard/entrepreneur', request.url));
    } else if (token?.role === 'investor') {
      return NextResponse.redirect(new URL('/dashboard/investor', request.url));
    }
  }
  
  // Otherwise, continue with the request
  return NextResponse.next();
}

// Configure which paths should trigger this middleware
export const config = {
  matcher: [
    // Match all paths except for static files, API routes (except callbacks), etc.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};