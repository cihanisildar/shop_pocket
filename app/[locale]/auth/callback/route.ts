import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/tr/dashboard'
  
  // Extract locale from next path or default to 'tr'
  const localeMatch = next.match(/^\/([a-z]{2})(\/|$)/)
  const locale = localeMatch ? localeMatch[1] : 'tr'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  redirect(next)
}

