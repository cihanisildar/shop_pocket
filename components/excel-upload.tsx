'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Check } from 'lucide-react'
import { parseExcelFile } from '@/lib/excel-parser'
import { uploadReferenceItems } from '@/app/actions/lists'
import { getCatalogs } from '@/app/actions/catalogs'
import CreateCatalogDialog from '@/components/create-catalog-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Catalog } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function ExcelUpload() {
  const router = useRouter()
  const t = useTranslations('catalog')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('')
  const [uploadMode, setUploadMode] = useState<'merge' | 'replace'>('replace')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadCatalogs()
  }, [])

  const loadCatalogs = async () => {
    const result = await getCatalogs()
    if (result.data) {
      setCatalogs(result.data)
      if (result.data.length > 0 && !selectedCatalogId) {
        setSelectedCatalogId(result.data[0].id)
      }
    }
  }

  const handleCatalogCreated = (catalogId: string) => {
    loadCatalogs()
    setSelectedCatalogId(catalogId)
  }

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError(t('invalidExcelFile'))
      return
    }

    if (!selectedCatalogId) {
      setError(t('selectCatalogFirst'))
      return
    }

    // Get selected catalog to access column mappings
    const selectedCatalog = catalogs.find(c => c.id === selectedCatalogId)
    
    if (!selectedCatalog) {
      setError(t('catalogNotFound'))
      return
    }

      // Check if column mappings are configured
      const mappings = selectedCatalog.column_mappings
      const hasMappings = mappings?.mappings 
        ? mappings.mappings.some(m => m.field && m.column.trim())
        : (mappings?.code || mappings?.name || mappings?.unit || mappings?.category || mappings?.price || mappings?.description)
      
      if (!hasMappings) {
        setError(t('configureColumnMappings'))
        return
      }

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const parsed = await parseExcelFile(file, selectedCatalog.column_mappings)
      
      const result = await uploadReferenceItems(parsed.referenceItems, selectedCatalogId, uploadMode)
      
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        // Reset file input so same file can be uploaded again
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        // Redirect to reference items page after a short delay
        setTimeout(() => {
          const locale = window.location.pathname.split('/')[1] || 'en'
          router.push(`/${locale}/reference-items`)
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToProcessFile'))
      // Reset file input on error too
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Catalog Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {t('selectCatalog')}
          </label>
          <CreateCatalogDialog onCatalogCreated={handleCatalogCreated} />
        </div>

        <Select
          value={selectedCatalogId}
          onValueChange={setSelectedCatalogId}
          disabled={uploading || catalogs.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('selectCatalogPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {catalogs.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-gray-500">
                {t('noCatalogs')}
              </div>
            ) : (
              catalogs.map((catalog) => {
                const mappings = catalog.column_mappings
                const hasMappings = mappings?.mappings 
                  ? mappings.mappings.some(m => m.field && m.column.trim())
                  : (mappings?.code || mappings?.name || mappings?.unit || mappings?.category || mappings?.price || mappings?.description)
                return (
                  <SelectItem key={catalog.id} value={catalog.id}>
                    {catalog.name}
                    {hasMappings ? ' ✓' : ` (${t('needsConfig')})`}
                  </SelectItem>
                )
              })
            )}
          </SelectContent>
        </Select>
        
        {selectedCatalogId && (() => {
          const catalog = catalogs.find(c => c.id === selectedCatalogId)
          if (!catalog) return null
          const mappings = catalog.column_mappings
          const hasMappings = mappings?.mappings 
            ? mappings.mappings.some(m => m.field && m.column.trim())
            : (mappings?.code || mappings?.name || mappings?.unit || mappings?.category || mappings?.price || mappings?.description)
          if (!hasMappings) {
            return (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                {t('needsColumnMappingsWarning')}
              </div>
            )
          }
          return null
        })()}
      </div>

      {/* Upload Mode Selection */}
      {selectedCatalogId && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('uploadMode')}
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="uploadMode"
                value="replace"
                checked={uploadMode === 'replace'}
                onChange={(e) => setUploadMode(e.target.value as 'replace')}
                className="w-4 h-4 text-indigo-600"
                disabled={uploading}
              />
              <span className="text-sm text-gray-700">
                {t('uploadModeReplace')}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="uploadMode"
                value="merge"
                checked={uploadMode === 'merge'}
                onChange={(e) => setUploadMode(e.target.value as 'merge')}
                className="w-4 h-4 text-indigo-600"
                disabled={uploading}
              />
              <span className="text-sm text-gray-700">
                {t('uploadModeMerge')}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* File Upload Area */}
      {(() => {
        const selectedCatalog = catalogs.find(c => c.id === selectedCatalogId)
        const mappings = selectedCatalog?.column_mappings
        const hasColumnMappings = mappings?.mappings 
          ? mappings.mappings.some(m => (m.field === 'code' || m.field === 'name') && m.column)
          : (mappings?.code && mappings?.name)
        const isDisabled = uploading || !selectedCatalogId || !hasColumnMappings

        return (
          <div
            onDragOver={(e) => {
              if (!isDisabled) {
                e.preventDefault()
                setIsDragging(true)
              }
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              if (!isDisabled) {
                handleDrop(e)
              }
            }}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all
              ${isDragging && !isDisabled ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}
              ${isDisabled ? 'opacity-50 pointer-events-none' : 'hover:border-gray-400'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInput}
              disabled={isDisabled}
              className="hidden"
            />

            {success ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-green-600 font-medium">{t('uploadSuccessful')}</p>
              </div>
            ) : (
              <>
                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging && !isDisabled ? 'text-indigo-600' : 'text-gray-400'}`} />
                <p className="text-gray-700 mb-2">
                  {uploading ? t('processing') : t('dragDropExcel')}
                </p>
                <p className="text-sm text-gray-500 mb-4">{t('or')}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isDisabled}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('browseFiles')}
                </button>
              </>
            )}
          </div>
        )
      })()}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  )
}

