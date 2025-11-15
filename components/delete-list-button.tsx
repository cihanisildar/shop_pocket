'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { deleteList } from '@/app/actions/lists'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'

interface DeleteListButtonProps {
  listId: string
}

export default function DeleteListButton({ listId }: DeleteListButtonProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations()
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (confirm(t('common.confirm'))) {
      const result = await deleteList(listId)
      if (!result.error) {
        router.push(`/${locale}/dashboard`)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        {t('common.delete')}
      </button>
    </form>
  )
}

