import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Extract locale from pathname (e.g., /en/login -> /login)
  const pathname = request.nextUrl.pathname
  const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/')
  const locale = pathname.match(/^\/([a-z]{2})(\/|$)/)?.[1] || 'tr'

  // IMPORTANT: Never redirect the callback route - it needs to process the code
  if (pathnameWithoutLocale.startsWith('/auth/callback')) {
    return supabaseResponse
  }

  // If user is authenticated, redirect them away from homepage/login/signup to dashboard
  if (user) {
    if (
      pathnameWithoutLocale === '/' ||
      pathnameWithoutLocale.startsWith('/login') ||
      pathnameWithoutLocale.startsWith('/signup')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = `/${locale}/dashboard`
      url.search = '' // Clear query params
      return NextResponse.redirect(url)
    }
  }

  // If no user, redirect protected routes to login
  if (
    !user &&
    pathnameWithoutLocale !== '/' &&
    !pathnameWithoutLocale.startsWith('/login') &&
    !pathnameWithoutLocale.startsWith('/signup') &&
    !pathnameWithoutLocale.startsWith('/auth/callback')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    // Preserve locale in redirect
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/login`
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}

