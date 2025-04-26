import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware function runs on every request
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define which paths are accessible to logged in users
  const isPrivatePath = 
    path.startsWith('/dashboard') || 
    path.startsWith('/profile');
  
  // Define which paths are only accessible to logged out users
  const isAuthPath = 
    path.startsWith('/login') || 
    path.startsWith('/register');
  
  // Check if user has an active session
  const userSession = request.cookies.get('user_session')?.value;
  const isLoggedIn = !!userSession;
  
  // If trying to access private routes without being logged in,
  // redirect to login page
  if (isPrivatePath && !isLoggedIn) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }
  
  // If trying to access login/register pages while logged in,
  // redirect to dashboard
  if (isAuthPath && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Otherwise, continue with the request
  return NextResponse.next();
}

// Configure which paths should trigger this middleware
export const config = {
  matcher: [
    // Match all paths except for static files, api routes, etc.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};