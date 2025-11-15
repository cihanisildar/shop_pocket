'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { deleteCatalog } from '@/app/actions/catalogs'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import toast from 'react-hot-toast'

interface DeleteCatalogDialogProps {
  catalogId: string
  catalogName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export default function DeleteCatalogDialog({
  catalogId,
  catalogName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCatalogDialogProps) {
  const router = useRouter()
  const t = useTranslations('catalog')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setError(null)
    setLoading(true)

    const result = await deleteCatalog(catalogId)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(t('catalogDeletedSuccessfully'))
      onOpenChange(false)
      router.refresh()
      if (onDeleted) {
        onDeleted()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && onOpenChange(open)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-red-900">
              {t('deleteCatalogTitle')}
            </DialogTitle>
          </div>
          <DialogDescription className="mt-3 text-base text-gray-700">
            {t('deleteConfirm')}
          </DialogDescription>
          {catalogName && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                <span className="text-gray-600">{t('catalogName')}:</span>{' '}
                <span className="font-semibold">{catalogName}</span>
              </p>
            </div>
          )}
        </DialogHeader>
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}
        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false)
              setError(null)
            }}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? t('deleting') : t('delete')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

