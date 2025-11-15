import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import Link from 'next/link'
import { ArrowLeft, Package, List as ListIcon, LogOut, FolderOpen } from 'lucide-react'
import ReferenceItemsManager from '@/components/reference-items-manager'
import CatalogManager from '@/components/catalog-manager'
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from '@/components/language-switcher'

export default async function ReferenceItemsPage({
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
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('referenceItems.backToDashboard')}
          </Link>
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
              className="flex items-center gap-2 px-4 py-2 text-indigo-600 rounded-lg transition-colors duration-200"
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

        {/* Catalogs Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-8 border border-white/30 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <FolderOpen className="w-6 h-6 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">{t('catalog.catalogs')}</h1>
          </div>
          <CatalogManager />
        </div>

        {/* Reference Items Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-8 border border-white/30">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-6 h-6 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">{t('referenceItems.title')}</h1>
          </div>
          <p className="text-gray-600 mb-6">
            {t('referenceItems.subtitle')}
          </p>
          <ReferenceItemsManager />
        </div>
      </div>
    </div>
  )
}

