'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { deleteList } from '@/app/actions/lists'
import { useTranslations } from 'next-intl'

interface DeleteListItemButtonProps {
  listId: string
}

export default function DeleteListItemButton({ listId }: DeleteListItemButtonProps) {
  const router = useRouter()
  const t = useTranslations()
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm(t('common.confirm'))) {
      const result = await deleteList(listId)
      if (!result.error) {
        router.refresh()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <button
        type="submit"
        className="p-2 text-red-600 hover:bg-red-50 hover:scale-110 rounded-lg transition-all duration-200"
        title={t('common.delete')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </form>
  )
}

