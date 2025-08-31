import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // Apply internationalization middleware first
  const response = intlMiddleware(request);
  
  // Get the auth token from localStorage (client-side) 
  // Note: In server middleware, we need to use cookies instead
  const authToken = request.cookies.get('authToken')?.value;
  
  // Check if accessing dashboard routes
  const isDashboardRoute = request.nextUrl.pathname.includes('/dashboard');
  
  if (isDashboardRoute && !authToken) {
    // If accessing dashboard without auth token, let the layout handle the redirect
    // This allows for proper locale-aware redirects
    return response;
  }
  
  return response;
}
 
export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};