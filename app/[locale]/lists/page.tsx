import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { getLists, deleteList } from '@/app/actions/lists'
import Link from 'next/link'
import { ArrowLeft, Plus, List as ListIcon, Package, LogOut } from 'lucide-react'
import DeleteListItemButton from '@/components/delete-list-item-button'
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from '@/components/language-switcher'

export default async function ListsPage({
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

  const { data: lists } = await getLists()

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('lists.backToDashboard')}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href={`/${locale}/lists`}
              className="flex items-center gap-2 px-4 py-2 text-indigo-600 rounded-lg transition-colors duration-200"
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
            <Link
              href={`/${locale}/lists/new`}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 hover:shadow-md transition-all duration-200 ml-2"
            >
              <Plus className="w-4 h-4" />
              {t('lists.newList')}
            </Link>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-8 border border-white/30">
          <div className="flex items-center gap-3 mb-6">
            <ListIcon className="w-6 h-6 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">{t('lists.title')}</h1>
          </div>
          <p className="text-gray-600 mb-6">
            {t('lists.subtitle')}
          </p>

          {!lists || lists.length === 0 ? (
            <div className="text-center py-12">
              <ListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4 text-lg">{t('lists.noLists')}</p>
              <Link
                href={`/${locale}/lists/new`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('lists.createList')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className="relative group p-6 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                >
                  <Link
                    href={`/${locale}/lists/${list.id}`}
                    className="block"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg group-hover:text-indigo-600 transition-colors">{list.name}</h3>
                    {list.description && (
                      <p className="text-sm text-gray-600 mb-4">{list.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{list.items?.length || 0} {list.items?.length !== 1 ? t('common.items') : t('common.item')}</span>
                      <span>{new Date(list.created_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                  <DeleteListItemButton listId={list.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

