'use client'

import { useState, useEffect } from 'react'
import { Edit2, Trash2, Package, Settings, X, Check } from 'lucide-react'
import { getCatalogs, updateCatalog, deleteCatalog } from '@/app/actions/catalogs'
import CreateCatalogDialog from '@/components/create-catalog-dialog'
import ColumnMappingDialog from '@/components/column-mapping-dialog'
import type { Catalog } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function CatalogManager() {
  const router = useRouter()
  const t = useTranslations('catalog')
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadCatalogs()
  }, [])

  const loadCatalogs = async () => {
    setLoading(true)
    const result = await getCatalogs()
    if (result.data) {
      setCatalogs(result.data)
    }
    setLoading(false)
  }

  const handleCatalogCreated = (catalogId: string) => {
    loadCatalogs()
  }

  const handleEdit = (catalog: Catalog) => {
    setEditingId(catalog.id)
    setFormData({
      name: catalog.name,
      description: catalog.description || '',
    })
    setError(null)
  }

  const handleUpdate = async (e: React.FormEvent, catalogId: string) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!formData.name.trim()) {
      setError(t('nameRequired'))
      return
    }

    setLoading(true)
    const result = await updateCatalog(catalogId, {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    })
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setEditingId(null)
      setFormData({ name: '', description: '' })
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ name: '', description: '' })
    setError(null)
  }

  const handleDelete = async (catalogId: string) => {
    if (!confirm(t('deleteConfirm'))) {
      return
    }

    setLoading(true)
    const result = await deleteCatalog(catalogId)
    setLoading(false)

    if (!result.error) {
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{t('catalogs')}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('manageCatalogs')}
          </p>
        </div>
        {!editingId && (
          <CreateCatalogDialog onCatalogCreated={handleCatalogCreated} />
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          {t('catalogUpdatedSuccessfully')}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Edit Form */}
      {editingId && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? t('editCatalog') : t('createNewCatalog')}
            </h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={(e) => handleUpdate(e, editingId)} className="space-y-4">
            <div>
              <label htmlFor="catalog-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('catalogName')} *
              </label>
              <input
                id="catalog-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., BİM Products"
              />
            </div>
            <div>
              <label htmlFor="catalog-desc" className="block text-sm font-medium text-gray-700 mb-1">
                {t('catalogDescription')}
              </label>
              <textarea
                id="catalog-desc"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('optionalDescription')}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {editingId ? t('update') : t('create')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Catalogs List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading && !editingId ? (
          <div className="p-8 text-center text-gray-500">{t('loading')}</div>
        ) : catalogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p>{t('noCatalogs')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {catalogs.map((catalog) => (
              <div
                key={catalog.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                {editingId === catalog.id ? (
                  <form onSubmit={(e) => handleUpdate(e, catalog.id)} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('catalogName')} *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('catalogDescription')}</label>
                      <textarea
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                        {t('update')}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">{catalog.name}</h3>
                    </div>
                    {catalog.description && (
                      <p className="text-sm text-gray-600 mt-1">{catalog.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {t('created')} {new Date(catalog.created_at).toLocaleDateString()}
                      {(() => {
                        const mappings = catalog.column_mappings
                        const hasMappings = mappings?.mappings 
                          ? mappings.mappings.some(m => m.field && m.column.trim())
                          : (mappings?.code || mappings?.name || mappings?.unit || mappings?.category || mappings?.price || mappings?.description)
                        return hasMappings && (
                          <span className="ml-2 text-green-600">• {t('columnMappingsConfigured')}</span>
                        )
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <ColumnMappingDialog catalog={catalog} />
                    <button
                      onClick={() => handleEdit(catalog)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title={t('editCatalogTitle')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(catalog.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('deleteCatalogTitle')}
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
  )
}

