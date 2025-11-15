import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // Extract locale from the current path (e.g., /tr/auth/callback -> tr)
  const pathname = requestUrl.pathname
  const localeMatch = pathname.match(/^\/([a-z]{2})\/auth\/callback/)
  const locale = localeMatch ? localeMatch[1] : 'tr'
  
  // Get the next parameter or default to dashboard with the correct locale
  const next = requestUrl.searchParams.get('next') ?? `/${locale}/dashboard`
  
  // Ensure next has a locale prefix
  const nextWithLocale = next.startsWith('/') && !next.match(/^\/([a-z]{2})(\/|$)/)
    ? `/${locale}${next}`
    : next

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    // If there's an error exchanging the code, redirect to login
    if (error) {
      redirect(`/${locale}/login?error=auth_failed`)
      return
    }
  }

  // Use absolute URL for redirect to avoid any relative path issues
  redirect(nextWithLocale)
}

