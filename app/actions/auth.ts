'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function signInWithGoogle() {
  const supabase = await createClient()
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || headersList.get('referer') || ''
  
  // Extract locale from pathname or default to 'tr'
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/)
  const locale = localeMatch ? localeMatch[1] : 'tr'
  
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/${locale}/auth/callback?next=/${locale}/dashboard`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createClient()
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || headersList.get('referer') || ''
  
  // Extract locale from pathname or default to 'tr'
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/)
  const locale = localeMatch ? localeMatch[1] : 'tr'
  
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect(`/${locale}/login`)
}

