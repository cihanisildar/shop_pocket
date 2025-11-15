import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { locales } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'tr',
  localePrefix: 'always'
});

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const code = request.nextUrl.searchParams.get('code')
  
  // Handle Supabase auth callback - catch any path with code parameter
  // This includes /dashboard, /en, /tr, etc.
  if (code) {
    // Extract locale from pathname (e.g., /en -> en, /tr -> tr, /dashboard -> default to tr)
    const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/)
    const locale = localeMatch ? localeMatch[1] : 'tr'
    
    // Redirect to the proper callback route
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/auth/callback`
    // Preserve all query parameters (code, next, etc.)
    return NextResponse.redirect(url)
  }

  // Let i18n middleware handle routing first
  const intlResponse = intlMiddleware(request);

  // Set pathname header for layouts to access
  intlResponse.headers.set('x-pathname', request.nextUrl.pathname);

  // If i18n redirected (e.g., / to /en), return immediately
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }

  // Handle Supabase session - this checks authentication status
  const supabaseResponse = await updateSession(request);

  // If Supabase redirected, use that redirect (it already preserves locale)
  if (supabaseResponse.status === 307 || supabaseResponse.status === 308) {
    // Merge intl headers into Supabase redirect to preserve locale context
    intlResponse.headers.forEach((value, key) => {
      supabaseResponse.headers.set(key, value);
    });
    return supabaseResponse;
  }

  // Both passed through - use intl response as base (preserves locale context)
  // Merge Supabase cookies and headers into intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  // Copy Supabase headers (like auth headers) into intl response
  supabaseResponse.headers.forEach((value, key) => {
    // Don't override locale-related headers from intl
    if (!key.startsWith('x-next-intl') && key !== 'x-pathname') {
      intlResponse.headers.set(key, value);
    }
  });

  // Ensure the pathname header is set on the final response
  intlResponse.headers.set('x-pathname', request.nextUrl.pathname);

  return intlResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

