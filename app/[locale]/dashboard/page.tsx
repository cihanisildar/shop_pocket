import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import Link from 'next/link'
import { LogOut, FileUp, Package, List as ListIcon } from 'lucide-react'
import ExcelUpload from '@/components/excel-upload'
import ExcelFormatDialog from '@/components/excel-format-dialog'
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from '@/components/language-switcher'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            <p className="text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href={`/${locale}/lists`}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 rounded-lg transition-colors duration-200"
            >
              <ListIcon className="w-4 h-4" />
              {t('dashboard.lists')}
            </Link>
            <Link
              href={`/${locale}/reference-items`}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 rounded-lg transition-colors duration-200"
            >
              <Package className="w-4 h-4" />
              {t('dashboard.referenceItems')}
            </Link>
          <form action={signOut}>
            <button
              type="submit"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              {t('auth.signOut')}
            </button>
          </form>
          </div>
        </div>

        {/* Excel Upload Section */}
        <div className="mb-8">
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/30 relative">
            <div className="absolute top-4 right-4">
              <ExcelFormatDialog />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <FileUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.uploadReferenceList')}</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              {t('dashboard.uploadDescription')}
            </p>
            <ExcelUpload />
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href={`/${locale}/lists`}
            className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/30 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <ListIcon className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.yourLists')}</h2>
            </div>
            <p className="text-gray-600 text-sm">
              {t('dashboard.yourListsDescription')}
            </p>
            </Link>

              <Link
            href={`/${locale}/reference-items`}
            className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/30 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.referenceItems')}</h2>
            </div>
            <p className="text-gray-600 text-sm">
              {t('dashboard.referenceItemsDescription')}
            </p>
                </Link>
        </div>
      </div>
    </div>
  )
}

