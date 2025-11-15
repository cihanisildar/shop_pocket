import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLists, deleteList } from '@/app/actions/lists'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ListManager from '@/components/list-manager'
import DeleteListButton from '@/components/delete-list-button'
import { getTranslations } from 'next-intl/server'

interface ListPageProps {
  params: Promise<{ id: string; locale: string }>
}

export default async function ListPage({ params }: ListPageProps) {
  const { id, locale } = await params
  const t = await getTranslations({ locale })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const { data: lists } = await getLists()
  const list = lists?.find(l => l.id === id)

  if (!list) {
    redirect(`/${locale}/dashboard`)
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('lists.backToDashboard')}
          </Link>
          
          <DeleteListButton listId={id} />
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-8 border border-white/30">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{list.name}</h1>
            {list.description && (
              <p className="text-gray-600">{list.description}</p>
            )}
          </div>

          <ListManager
            listId={list.id}
            items={list.items || []}
            listName={list.name}
          />
        </div>
      </div>
    </div>
  )
}

