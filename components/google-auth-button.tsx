'use client'

import { useState } from 'react'
import { signInWithGoogle } from '@/app/actions/auth'
import { useTranslations } from 'next-intl'

interface GoogleAuthButtonProps {
  locale?: string
}

export default function GoogleAuthButton({ locale }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false)
  const t = useTranslations('auth')

  async function handleGoogleSignIn() {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Error signing in with Google:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="group relative w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-white/25 via-white/20 to-white/25 backdrop-blur-lg border border-white/40 rounded-2xl font-semibold text-white hover:from-white/35 hover:via-white/30 hover:to-white/35 hover:border-white/50 hover:shadow-2xl hover:shadow-white/20 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl overflow-hidden"
    >
      {/* Button shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      {/* Google logo with subtle glow */}
      <div className="relative z-10 flex items-center justify-center">
        <svg className="w-6 h-6 drop-shadow-lg" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      </div>
      
      <span className="relative z-10 text-[16px] font-semibold text-white tracking-wide" style={{ fontFamily: 'var(--font-barlow)' }}>
        {loading ? t('signingIn') : t('continueWithGoogle')}
      </span>
      
      {loading && (
        <svg
          className="relative z-10 animate-spin h-5 w-5 ml-2 text-white/80"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
    </button>
  )
}

