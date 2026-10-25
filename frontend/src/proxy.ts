import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The API sets this httpOnly cookie at login. The API checks it on each request.
const AUTH_COOKIE = 'access_token';

/** Sends a user without a session cookie to the login page. */
export function proxy(request: NextRequest) {
  if (request.cookies.has(AUTH_COOKIE)) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  const returnPath = request.nextUrl.pathname + request.nextUrl.search;
  if (returnPath !== '/') {
    loginUrl.searchParams.set('next', returnPath);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Not for the API (the rewrite to the backend, also for large uploads), the Next.js files,
  // the login page and the files with an extension in `public/`.
  matcher: ['/((?!api|_next|login|.*\\..*).*)'],
};
