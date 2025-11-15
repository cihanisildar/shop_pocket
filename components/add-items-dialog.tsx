'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, X } from 'lucide-react'
import { getReferenceItems, addListItem } from '@/app/actions/lists'
import { getCatalogs } from '@/app/actions/catalogs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { ReferenceItem, ListItem, Catalog } from '@/lib/types'
import { useTranslations } from 'next-intl'

interface AddItemsDialogProps {
  listId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemsAdded: (items: ListItem[]) => void
}

export default function AddItemsDialog({ listId, open, onOpenChange, onItemsAdded }: AddItemsDialogProps) {
  const router = useRouter()
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('__all__')
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('')
  const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ReferenceItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [quantityMap, setQuantityMap] = useState<Record<string, number>>({})

  useEffect(() => {
    if (open) {
      loadCatalogs()
    } else {
      // Reset state when dialog closes
      setSearchQuery('')
      setCategoryFilter('__all__')
      setSelectedCatalogId('')
      setReferenceItems([])
      setFilteredItems([])
      setCategories([])
      setSelectedItems(new Set())
      setQuantityMap({})
    }
  }, [open])

  useEffect(() => {
    if (selectedCatalogId && open) {
      const filter = categoryFilter === '__all__' ? '' : categoryFilter
      loadReferenceItems(selectedCatalogId, searchQuery, filter)
    } else {
      setReferenceItems([])
      setFilteredItems([])
      setCategories([])
    }
  }, [selectedCatalogId, searchQuery, categoryFilter, open])

  const loadCatalogs = async () => {
    const result = await getCatalogs()
    if (result.data) {
      setCatalogs(result.data)
      if (result.data.length > 0 && !selectedCatalogId) {
        setSelectedCatalogId(result.data[0].id)
      }
    }
  }

  const loadReferenceItems = async (catalogId: string, search?: string, category?: string) => {
    setLoading(true)
    const result = await getReferenceItems(catalogId, search, category)
    if (result.data) {
      setReferenceItems(result.data)
      setFilteredItems(result.data)
      
      // Extract unique categories
      const uniqueCategories = [...new Set(result.data.map(item => item.category).filter(Boolean))]
      setCategories(uniqueCategories as string[])
    }
    setLoading(false)
  }

  const handleAddItems = async () => {
    if (selectedItems.size === 0) return

    setLoading(true)
    const newItems: ListItem[] = []
    const errors: string[] = []

    for (const itemId of selectedItems) {
      const item = referenceItems.find(r => r.id === itemId)
      if (item) {
        const quantity = quantityMap[itemId] || 1
        const result = await addListItem(listId, {
          code: item.code,
          name: item.name,
          quantity,
          unit: item.unit,
        })
        if (!result.error && result.data) {
          newItems.push(result.data)
        } else {
          errors.push(result.error || t('addItems.failedToAdd', { count: 1 }))
          console.error('Failed to add item:', result.error, result)
        }
      }
    }

    if (newItems.length > 0) {
      onItemsAdded(newItems)
      toast.success(newItems.length > 1 ? t('addItems.addedSuccessfullyPlural', { count: newItems.length }) : t('addItems.addedSuccessfully', { count: newItems.length }))
      // Close dialog and reset
      setSelectedItems(new Set())
      setQuantityMap({})
      onOpenChange(false)
      router.refresh()
    }

    if (errors.length > 0) {
      toast.error(errors.length > 1 ? t('addItems.failedToAddPlural', { count: errors.length }) : t('addItems.failedToAdd', { count: errors.length }))
    }

    setLoading(false)
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
      const newQuantityMap = { ...quantityMap }
      delete newQuantityMap[itemId]
      setQuantityMap(newQuantityMap)
    } else {
      newSelected.add(itemId)
      setQuantityMap({ ...quantityMap, [itemId]: 1 })
    }
    setSelectedItems(newSelected)
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity > 0) {
      setQuantityMap({ ...quantityMap, [itemId]: quantity })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle>{t('addItems.title')}</DialogTitle>
          <DialogDescription>
            {t('addItems.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
          {/* Catalog Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('addItems.selectCatalog')}
            </label>
            <Select
              value={selectedCatalogId}
              onValueChange={setSelectedCatalogId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('addItems.selectCatalogPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {catalogs.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    {t('addItems.noCatalogs')}
                  </div>
                ) : (
                  catalogs.map((catalog) => (
                    <SelectItem key={catalog.id} value={catalog.id}>
                      {catalog.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Search and Filter */}
          {selectedCatalogId && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('addItems.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              {categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="min-w-[200px] pl-10">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <SelectValue placeholder={t('addItems.allCategories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t('addItems.allCategories')}</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Selected Items Summary */}
          {selectedItems.size > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-indigo-900">
                  {selectedItems.size} {selectedItems.size > 1 ? t('common.items') : t('common.item')} {t('common.selected')}
                </span>
                <button
                  onClick={() => {
                    setSelectedItems(new Set())
                    setQuantityMap({})
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {t('common.clear')}
                </button>
              </div>
              
              <div className="space-y-2 mb-4">
                {Array.from(selectedItems).map(itemId => {
                  const item = referenceItems.find(r => r.id === itemId)
                  if (!item) return null
                  return (
                    <div key={itemId} className="flex items-center justify-between bg-white rounded p-2">
                      <span className="text-sm">{item.name} ({item.code})</span>
                      <input
                        type="number"
                        min="1"
                        value={quantityMap[itemId] || 1}
                        onChange={(e) => updateQuantity(itemId, parseInt(e.target.value) || 1)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )
                })}
              </div>
              
              <button
                onClick={handleAddItems}
                disabled={loading}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {loading ? t('addItems.adding') : selectedItems.size > 1 ? t('addItems.addItemsPlural', { count: selectedItems.size }) : t('addItems.addItems', { count: selectedItems.size })}
              </button>
            </div>
          )}

          {/* Reference Items List */}
          {selectedCatalogId && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {searchQuery || categoryFilter !== '__all__' ? t('addItems.noItemsFound') : t('addItems.noItemsInCatalog')}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedItems.has(item.id!) ? 'bg-indigo-50' : ''
                        }`}
                        onClick={() => toggleItemSelection(item.id!)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id!)}
                                onChange={() => toggleItemSelection(item.id!)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <div>
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-500">
                                  {t('common.code')}: {item.code}
                                  {item.category && ` • ${item.category}`}
                                  {item.unit && ` • ${t('common.unit')}: ${item.unit}`}
                                  {item.price && ` • ${t('common.price')}: ${item.price}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

