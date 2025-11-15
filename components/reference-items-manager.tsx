'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Trash2, X, Edit2, Check, Loader2, FileSpreadsheet } from 'lucide-react'
import { getReferenceItems, addReferenceItem, updateReferenceItem, deleteReferenceItem } from '@/app/actions/lists'
import { getCatalogs } from '@/app/actions/catalogs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ReferenceItem, Catalog } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

export default function ReferenceItemsManager() {
  const router = useRouter()
  const t = useTranslations('referenceItems')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('__all__')
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('')
  const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ReferenceItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    price: '',
    unit: '',
    description: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    code: '',
    name: '',
    category: '',
    price: '',
    unit: '',
    description: '',
  })

  useEffect(() => {
    loadCatalogs()
  }, [])

  useEffect(() => {
    if (selectedCatalogId) {
      const filter = categoryFilter === '__all__' ? '' : categoryFilter
      loadReferenceItems(selectedCatalogId, searchQuery, filter)
    } else {
      setReferenceItems([])
      setFilteredItems([])
      setCategories([])
    }
  }, [selectedCatalogId, searchQuery, categoryFilter])

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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!selectedCatalogId) {
      setError('Please select a catalog first')
      return
    }

    if (!formData.code.trim() || !formData.name.trim()) {
      setError('Code and Name are required')
      return
    }

    setLoading(true)
    const result = await addReferenceItem({
      code: formData.code.trim(),
      name: formData.name.trim(),
      category: formData.category.trim() || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      unit: formData.unit.trim() || undefined,
      description: formData.description.trim() || undefined,
    }, selectedCatalogId)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setFormData({
        code: '',
        name: '',
        category: '',
        price: '',
        unit: '',
        description: '',
      })
      setShowAddForm(false)
      setTimeout(() => setSuccess(false), 3000)
      // Reload items immediately
      if (selectedCatalogId) {
        const filter = categoryFilter === '__all__' ? '' : categoryFilter
        loadReferenceItems(selectedCatalogId, searchQuery, filter)
      }
      router.refresh()
    }
  }

  const handleEditItem = (item: ReferenceItem) => {
    setEditingId(item.id!)
    setEditFormData({
      code: item.code,
      name: item.name,
      category: item.category || '',
      price: item.price?.toString() || '',
      unit: item.unit || '',
      description: item.description || '',
    })
    setError(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditFormData({
      code: '',
      name: '',
      category: '',
      price: '',
      unit: '',
      description: '',
    })
    setError(null)
  }

  const handleUpdateItem = async (e: React.FormEvent, itemId: string) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!editFormData.code.trim() || !editFormData.name.trim()) {
      setError('Code and Name are required')
      return
    }

    setLoading(true)
    const result = await updateReferenceItem(itemId, {
      code: editFormData.code.trim(),
      name: editFormData.name.trim(),
      category: editFormData.category.trim() || undefined,
      price: editFormData.price ? parseFloat(editFormData.price) : undefined,
      unit: editFormData.unit.trim() || undefined,
      description: editFormData.description.trim() || undefined,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setEditingId(null)
      setTimeout(() => setSuccess(false), 3000)
      // Reload items immediately
      if (selectedCatalogId) {
        const filter = categoryFilter === '__all__' ? '' : categoryFilter
        loadReferenceItems(selectedCatalogId, searchQuery, filter)
      }
      router.refresh()
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(t('deleteConfirm'))) {
      return
    }

    setLoading(true)
    const result = await deleteReferenceItem(itemId)
    setLoading(false)

    if (!result.error) {
      // Reload items immediately
      if (selectedCatalogId) {
        const filter = categoryFilter === '__all__' ? '' : categoryFilter
        loadReferenceItems(selectedCatalogId, searchQuery, filter)
      }
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  const handleExportToExcel = () => {
    if (filteredItems.length === 0) {
      toast.error(t('noItemsToExport'))
      return
    }

    // Get catalog name for filename
    const catalogName = catalogs.find(c => c.id === selectedCatalogId)?.name || 'ReferenceItems'

    // Prepare data for Excel
    const excelData = [
      [t('code'), t('name'), t('category'), t('price'), t('unit'), t('description')], // Headers
      ...filteredItems.map(item => [
        item.code,
        item.name,
        item.category || '',
        item.price || '',
        item.unit || '',
        item.description || ''
      ])
    ]

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(excelData)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Code
      { wch: 40 }, // Name
      { wch: 20 }, // Category
      { wch: 12 }, // Price
      { wch: 15 }, // Unit
      { wch: 30 }  // Description
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, t('referenceItemsTitle'))

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0]
    const filename = `${catalogName.replace(/[^a-z0-9]/gi, '_')}_${date}.xlsx`

    // Write and download
    XLSX.writeFile(workbook, filename)
    toast.success(t('exportedSuccessfully'))
  }

  return (
    <div className="space-y-6">
      {/* Catalog Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('selectCatalog')}
        </label>
        <Select
          value={selectedCatalogId}
          onValueChange={setSelectedCatalogId}
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('selectCatalogPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {catalogs.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-gray-500">
                {t('noCatalogsAvailable')}
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

              {/* Header and Add Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('referenceItemsTitle')}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCatalogId ? (
                      <>
                        {referenceItems.length} {referenceItems.length !== 1 ? t('items') : t('item')} {t('in')}{' '}
                        {catalogs.find(c => c.id === selectedCatalogId)?.name || t('selectedCatalog')}
                        {referenceItems.length === 0 && (
                          <span className="block mt-2 text-amber-600">
                            {t('noItemsYet')}
                          </span>
                        )}
                      </>
                    ) : (
                      t('selectCatalogToView')
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {filteredItems.length > 0 && selectedCatalogId && (
                    <button
                      onClick={handleExportToExcel}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t('exportExcel')}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      {t('exportExcel')}
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    disabled={!selectedCatalogId || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    {t('addItem')}
                  </button>
                </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          {t('itemAddedSuccessfully')}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('addNewReferenceItem')}</h3>
            <button
              onClick={() => {
                setShowAddForm(false)
                setError(null)
                setFormData({
                  code: '',
                  name: '',
                  category: '',
                  price: '',
                  unit: '',
                  description: '',
                })
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('code')} *
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t('productCode')}
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('name')} *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t('productName')}
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('category')}
                </label>
                <input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t('category')}
                />
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('unit')}
                </label>
                <input
                  id="unit"
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., kg, piece, box"
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('price')}
                </label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                {t('description')}
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('description')}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? t('adding') : t('addItem')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setError(null)
                  setFormData({
                    code: '',
                    name: '',
                    category: '',
                    price: '',
                    unit: '',
                    description: '',
                  })
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      {selectedCatalogId && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('searchByCodeOrName')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={loading}>
              <SelectTrigger className="min-w-[200px] pl-10">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <SelectValue placeholder={t('allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('allCategories')}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Reference Items List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {loading && !showAddForm ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">{t('loading')}</p>
            </div>
          ) : !selectedCatalogId ? (
            <div className="p-8 text-center text-gray-500">
              {t('selectCatalogToView')}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery || categoryFilter !== '__all__' ? t('noItemsFound') : t('noItemsYet')}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  {editingId === item.id ? (
                    <form onSubmit={(e) => handleUpdateItem(e, item.id!)} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('code')} *</label>
                          <input
                            type="text"
                            required
                            value={editFormData.code}
                            onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('name')} *</label>
                          <input
                            type="text"
                            required
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('category')}</label>
                          <input
                            type="text"
                            value={editFormData.category}
                            onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('unit')}</label>
                          <input
                            type="text"
                            value={editFormData.unit}
                            onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('price')}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.price}
                            onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('description')}</label>
                        <textarea
                          rows={2}
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
                        >
                          <Check className="w-4 h-4" />
                          {t('save')}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Code: {item.code}
                          {item.category && ` • Category: ${item.category}`}
                          {item.unit && ` • Unit: ${item.unit}`}
                          {item.price && ` • Price: ${item.price}`}
                        </div>
                        {item.description && (
                          <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title={t('editItem')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id!)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('deleteItem')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

