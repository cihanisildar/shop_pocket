'use client'

import { useState } from 'react'
import { Plus, FolderOpen } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createCatalog } from '@/app/actions/catalogs'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface CreateCatalogDialogProps {
  onCatalogCreated?: (catalogId: string) => void
  trigger?: React.ReactNode
}

export default function CreateCatalogDialog({ onCatalogCreated, trigger }: CreateCatalogDialogProps) {
  const router = useRouter()
  const t = useTranslations('catalog')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError(t('nameRequired'))
      return
    }

    setLoading(true)
    const result = await createCatalog(formData.name.trim(), formData.description.trim() || undefined)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setOpen(false)
      setFormData({ name: '', description: '' })
      router.refresh()
      if (onCatalogCreated) {
        onCatalogCreated(result.data.id)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" />
            {t('newCatalog')}
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FolderOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <DialogTitle>{t('createNewCatalog')}</DialogTitle>
          </div>
          <DialogDescription className="mt-2">
            {t('createNewCatalogDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label htmlFor="catalog-name" className="block text-sm font-semibold text-gray-900 mb-2">
                {t('catalogName')} <span className="text-red-500">*</span>
              </label>
              <input
                id="catalog-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-gray-900 placeholder-gray-400"
                placeholder="e.g., BİM Products"
              />
            </div>
            <div>
              <label htmlFor="catalog-desc" className="block text-sm font-semibold text-gray-900 mb-2">
                {t('catalogDescription')}
              </label>
              <textarea
                id="catalog-desc"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-gray-900 placeholder-gray-400 resize-none"
                placeholder={t('optionalDescription')}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setFormData({ name: '', description: '' })
                setError(null)
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? t('creating') : t('createCatalogButton')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

