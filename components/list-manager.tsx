'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, FileSpreadsheet } from 'lucide-react'
import { deleteListItem } from '@/app/actions/lists'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import type { ListItem } from '@/lib/types'
import AddItemsDialog from '@/components/add-items-dialog'
import { useTranslations } from 'next-intl'

interface ListManagerProps {
  listId: string
  items: ListItem[]
  listName?: string
}

export default function ListManager({ listId, items, listName = 'List' }: ListManagerProps) {
  const router = useRouter()
  const t = useTranslations()
  const [optimisticItems, setOptimisticItems] = useState<ListItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Merge server items with optimistic updates
  const serverItemIds = new Set(items.map(item => item.id))
  const remainingOptimisticItems = optimisticItems.filter(item => item.id && !serverItemIds.has(item.id))
  const listItems = [...items, ...remainingOptimisticItems]
  
  // Clean up optimistic items that are now confirmed by server
  const prevItemsRef = useRef(items)
  if (prevItemsRef.current !== items && optimisticItems.length > 0) {
    const confirmedIds = new Set(items.map(item => item.id))
    const stillPending = optimisticItems.filter(item => item.id && !confirmedIds.has(item.id))
    if (stillPending.length < optimisticItems.length) {
      Promise.resolve().then(() => {
        setOptimisticItems(stillPending)
      })
    }
    prevItemsRef.current = items
  }

  const handleItemsAdded = (newItems: ListItem[]) => {
    setOptimisticItems(prev => [...prev, ...newItems])
  }

  const handleDeleteItem = async (itemId: string) => {
    if (confirm(t('lists.removeItemConfirm'))) {
      // Optimistically remove from UI
      setOptimisticItems(prev => prev.filter(item => item.id !== itemId))
      
      const result = await deleteListItem(itemId)
      if (!result.error) {
        toast.success(t('lists.itemRemoved'))
        router.refresh()
      } else {
        toast.error(result.error || t('lists.failedToRemove'))
        router.refresh()
      }
    }
  }

  const handleExportToExcel = () => {
    if (listItems.length === 0) {
      toast.error(t('lists.noItemsToExport'))
      return
    }

    // Prepare data for Excel
    const excelData = [
      [t('common.code'), t('common.name'), t('common.quantity'), t('common.unit'), t('common.notes')], // Headers
      ...listItems.map(item => [
        item.code,
        item.name,
        item.quantity,
        item.unit || '',
        item.notes || ''
      ])
    ]

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(excelData)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Code
      { wch: 40 }, // Name
      { wch: 10 }, // Quantity
      { wch: 15 }, // Unit
      { wch: 30 }  // Notes
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, t('lists.listItems'))

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0]
    const filename = `${listName.replace(/[^a-z0-9]/gi, '_')}_${date}.xlsx`

    // Write and download
    XLSX.writeFile(workbook, filename)
    toast.success(t('lists.exportedSuccessfully'))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{t('lists.listItems')}</h2>
        <div className="flex items-center gap-2">
          {listItems.length > 0 && (
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title={t('lists.exportExcel')}
            >
              <FileSpreadsheet className="w-4 h-4" />
              {t('lists.exportExcel')}
            </button>
          )}
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('lists.addItems')}
          </button>
        </div>
      </div>

      {listItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">{t('lists.noItems')}</p>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('lists.addYourFirstItem')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {listItems.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                    {item.quantity}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    {t('common.code')}: {item.code} {item.unit && `• ${item.unit}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteItem(item.id!)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title={t('lists.removeItem')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AddItemsDialog
        listId={listId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onItemsAdded={handleItemsAdded}
      />
    </div>
  )
}


