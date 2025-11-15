import GoogleAuthButton from '@/components/google-auth-button'
import { getTranslations } from 'next-intl/server'

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Decorative gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="max-w-md w-full relative z-10">
        <div className="relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/30 overflow-hidden">
          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: 'var(--font-barlow)' }}>
                {t('auth.getStarted')}
              </h1>
              <p className="text-white/80 text-lg" style={{ fontFamily: 'var(--font-barlow)' }}>
                {t('auth.signUpWithGoogle')}
              </p>
            </div>
            
            <GoogleAuthButton locale={locale} />
          </div>
        </div>
      </div>
    </div>
  )
}

