'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import { useTransition } from 'react'

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const switchLocale = (newLocale: Locale) => {
    // Replace the locale in the pathname
    const segments = pathname.split('/')
    if (segments[1] && locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale
    } else {
      segments.splice(1, 0, newLocale)
    }

    const newPath = segments.join('/')
    startTransition(() => {
      router.push(newPath)
    })
  }

  return (
    <div className="flex items-center gap-2 border border-gray-300 rounded-lg overflow-hidden">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          disabled={isPending || locale === loc}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            locale === loc
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

