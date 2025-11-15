'use client'

import { useState, useEffect } from 'react'
import { Settings, FileSpreadsheet, Plus, Trash2, Upload, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateCatalog } from '@/app/actions/catalogs'
import ExcelPreview from '@/components/excel-preview'
import type { Catalog, ColumnMapping, ColumnMappingField } from '@/lib/types'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

interface ColumnMappingDialogProps {
  catalog: Catalog
  trigger?: React.ReactNode
}

export default function ColumnMappingDialog({ catalog, trigger }: ColumnMappingDialogProps) {
  const router = useRouter()
  const t = useTranslations()
  const tCommon = useTranslations('common')
  const tCatalog = useTranslations('catalog')
  const tColumnMapping = useTranslations('columnMapping')
  
  // Standard fields with translations
  const STANDARD_FIELDS = [
    { value: 'code', label: tCommon('code'), required: false, description: tColumnMapping('codeDescription') },
    { value: 'name', label: tCommon('name'), required: false, description: tColumnMapping('nameDescription') },
    { value: 'unit', label: tCommon('unit'), required: false, description: tColumnMapping('unitDescription') },
    { value: 'category', label: tCommon('category'), required: false, description: tColumnMapping('categoryDescription') },
    { value: 'price', label: tCommon('price'), required: false, description: tColumnMapping('priceDescription') },
    { value: 'description', label: tCommon('description'), required: false, description: tColumnMapping('descriptionDescription') },
  ]
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [headerRow, setHeaderRow] = useState<number>(catalog.column_mappings?.headerRow ?? 0)
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(new Set())
  const [mappings, setMappings] = useState<ColumnMappingField[]>(() => {
    // Convert legacy format to new format if needed
    const existing = catalog.column_mappings
    if (existing?.mappings && Array.isArray(existing.mappings) && existing.mappings.length > 0) {
      return existing.mappings
    }
    
    // Convert old format to new format
    const newMappings: ColumnMappingField[] = []
    if (existing?.code) newMappings.push({ field: 'code', column: existing.code })
    if (existing?.name) newMappings.push({ field: 'name', column: existing.name })
    if (existing?.unit) newMappings.push({ field: 'unit', column: existing.unit })
    if (existing?.category) newMappings.push({ field: 'category', column: existing.category })
    if (existing?.price) newMappings.push({ field: 'price', column: existing.price })
    if (existing?.description) newMappings.push({ field: 'description', column: existing.description })
    
    return newMappings
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validate that at least one mapping exists
    const validMappings = mappings.filter(m => m.field && m.column.trim())
    if (validMappings.length === 0) {
      setError(tCatalog('atLeastOneMapping'))
      // Scroll to top to show error
      const formElement = e.currentTarget as HTMLFormElement
      formElement.scrollTop = 0
      return
    }

    // Check for duplicate columns
    const columns = mappings.map(m => m.column.trim().toLowerCase()).filter(Boolean)
    const uniqueColumns = new Set(columns)
    if (columns.length !== uniqueColumns.size) {
      setError(tCatalog('duplicateColumns'))
      const formElement = e.currentTarget as HTMLFormElement
      formElement.scrollTop = 0
      return
    }

    // Check for mappings with column but no field
    const incompleteMappings = mappings.filter(m => !m.field && m.column.trim())
    if (incompleteMappings.length > 0) {
      setError(tCatalog('selectFieldForMapping', { count: incompleteMappings.length }))
      const formElement = e.currentTarget as HTMLFormElement
      formElement.scrollTop = 0
      return
    }

    setLoading(true)
    try {
      const result = await updateCatalog(catalog.id, {
        column_mappings: {
          headerRow,
          mappings: validMappings,
        },
      })
      
      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        const formElement = e.currentTarget as HTMLFormElement
        formElement.scrollTop = 0
      } else {
        setSuccess(true)
        toast.success(tCatalog('columnMappingsSaved'), {
          duration: 5000,
        })
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
          router.refresh()
        }, 1500)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : tCatalog('failedToSaveMappings')
      setError(errorMessage)
      toast.error(errorMessage)
      const formElement = e.currentTarget as HTMLFormElement
      formElement.scrollTop = 0
    } finally {
      setLoading(false)
    }
  }

  const addMapping = () => {
    // Find first unused standard field
    const usedFields = new Set(mappings.map(m => m.field))
    const availableField = STANDARD_FIELDS.find(f => !usedFields.has(f.value))
    
    if (availableField) {
      setMappings([...mappings, { field: availableField.value, column: '' }])
    } else {
      // Add custom field
      setMappings([...mappings, { field: '', column: '' }])
    }
  }

  const removeMapping = (index: number) => {
    // Don't allow removing if it's the last mapping
    if (mappings.length === 1) {
      setError(tCatalog('mustHaveOneMapping'))
      return
    }
    setMappings(mappings.filter((_, i) => i !== index))
    setError(null)
  }

  const updateMapping = (index: number, updates: Partial<ColumnMappingField>) => {
    const newMappings = [...mappings]
    newMappings[index] = { ...newMappings[index], ...updates }
    setMappings(newMappings)
    setError(null)
  }

  const getAvailableFields = (currentField: string) => {
    const usedFields = new Set(mappings.map(m => m.field).filter(f => f && f !== currentField))
    const available = STANDARD_FIELDS.filter(f => !usedFields.has(f.value) || f.value === currentField)
    
    // Add custom field if it exists and isn't a standard field
    if (currentField && !STANDARD_FIELDS.find(f => f.value === currentField)) {
      available.push({ value: currentField, label: currentField, required: false, description: tColumnMapping('customField') })
    }
    
    return available
  }

  const handleFieldChange = (index: number, value: string) => {
    // If selecting a custom field option, allow user to type custom name
    if (value === '__custom__') {
      updateMapping(index, { field: 'custom_' + Date.now() })
    } else if (value !== '__placeholder__') {
      updateMapping(index, { field: value })
    }
  }

  const columnIndexToLetter = (index: number): string => {
    let letter = ''
    let num = index
    while (num >= 0) {
      letter = String.fromCharCode(65 + (num % 26)) + letter
      num = Math.floor(num / 26) - 1
    }
    return letter
  }

  const handleColumnSelect = (columnIndex: number, columnLetter: string, headerName: string) => {
    // Toggle selection
    const newSelected = new Set(selectedColumns)
    if (newSelected.has(columnIndex)) {
      newSelected.delete(columnIndex)
      // Remove mapping for this column
      setMappings(mappings.filter(m => {
        const col = m.column.trim().toUpperCase()
        return col !== columnLetter && col !== headerName.toUpperCase()
      }))
    } else {
      newSelected.add(columnIndex)
      // Add new mapping with a suggested field based on header name
      const columnValue = headerName || columnLetter
      let suggestedField = ''
      
      // Try to auto-detect field from header name
      const headerLower = headerName.toLowerCase()
      if (headerLower.includes('kod') || headerLower.includes('code')) {
        suggestedField = 'code'
      } else if (headerLower.includes('ad') || headerLower.includes('name') || headerLower.includes('ürün')) {
        suggestedField = 'name'
      } else if (headerLower.includes('birim') || headerLower.includes('unit')) {
        suggestedField = 'unit'
      } else if (headerLower.includes('kategori') || headerLower.includes('category')) {
        suggestedField = 'category'
      } else if (headerLower.includes('fiyat') || headerLower.includes('price')) {
        suggestedField = 'price'
      } else if (headerLower.includes('açıklama') || headerLower.includes('description')) {
        suggestedField = 'description'
      } else {
        // Use first available standard field
        const usedFields = new Set(mappings.map(m => m.field))
        const availableField = STANDARD_FIELDS.find(f => !usedFields.has(f.value))
        suggestedField = availableField?.value || ''
      }
      
      setMappings([...mappings, { field: suggestedField, column: columnValue }])
    }
    setSelectedColumns(newSelected)
    setError(null) // Clear any previous errors
  }

  // Initialize selected columns from existing mappings when file is loaded
  useEffect(() => {
    if (open && mappings.length > 0 && excelFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const XLSX = require('xlsx')
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]
          
          const headerRowData = jsonData[headerRow] || []
          const newSelected = new Set<number>()
          
          mappings.forEach(mapping => {
            if (mapping.column) {
              const col = mapping.column.trim().toUpperCase()
              
              // Check if it's a column letter
              if (/^[A-Z]+$/.test(col)) {
                let index = 0
                for (let i = 0; i < col.length; i++) {
                  index = index * 26 + (col.charCodeAt(i) - 64)
                }
                newSelected.add(index - 1)
              } else {
                // Find by header name
                for (let i = 0; i < headerRowData.length; i++) {
                  if (headerRowData[i]?.toString().trim().toUpperCase() === col) {
                    newSelected.add(i)
                    break
                  }
                }
              }
            }
          })
          
          setSelectedColumns(newSelected)
        } catch (err) {
          // Ignore errors
        }
      }
      reader.readAsArrayBuffer(excelFile)
    } else if (open && !excelFile) {
      setSelectedColumns(new Set())
    }
  }, [open, excelFile, headerRow, mappings.length])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setExcelFile(file)
      setError(null)
    } else {
      setError(tCatalog('invalidExcelFile'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title={tColumnMapping('title')}>
            <Settings className="w-4 h-4" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            </div>
            <DialogTitle>{tColumnMapping('title')}</DialogTitle>
          </div>
          <DialogDescription className="mt-2">
            {tColumnMapping('subtitle')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden px-8 pb-6">
          <div className="flex-1 overflow-y-auto pr-3 space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-sm text-red-800 font-medium sticky top-0 z-10">
                <div className="flex items-start gap-2">
                  <span className="text-red-600">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg text-sm text-green-800 font-medium sticky top-0 z-10">
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>{tCatalog('columnMappingsSaved')}</span>
                </div>
              </div>
            )}

            {/* Excel File Upload */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {tColumnMapping('uploadExcelOptional')}
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  {tColumnMapping('uploadExcelDescription')}
                </p>
                {excelFile ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">{excelFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setExcelFile(null)
                        setSelectedColumns(new Set())
                      }}
                      className="p-1.5 text-green-700 hover:bg-green-100 rounded"
                      title={tColumnMapping('removeFile')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-700">{tColumnMapping('clickToUpload')}</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Header Row */}
              <div>
                <label htmlFor="headerRow" className="block text-sm font-semibold text-gray-900 mb-2">
                  {tColumnMapping('headerRow')}
                </label>
                <input
                  id="headerRow"
                  type="number"
                  min="0"
                  value={headerRow}
                  onChange={(e) => {
                    const newHeaderRow = parseInt(e.target.value) || 0
                    setHeaderRow(newHeaderRow)
                    setSelectedColumns(new Set()) // Reset selections when header row changes
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-gray-900"
                  placeholder="0"
                  disabled={!excelFile}
                />
                <p className="text-xs text-gray-500 mt-1.5">{tColumnMapping('headerRowDescription')}</p>
              </div>
            </div>

            {/* Excel Preview */}
            {excelFile && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  {tColumnMapping('selectColumns')}
                </label>
                <ExcelPreview
                  file={excelFile}
                  headerRow={headerRow}
                  onColumnSelect={handleColumnSelect}
                  selectedColumns={selectedColumns}
                />
              </div>
            )}

            {/* Column Mappings */}
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <label className="block text-base font-bold text-gray-900">
                  {tColumnMapping('columnMappings')}
                </label>
                <button
                  type="button"
                  onClick={addMapping}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  {tColumnMapping('addColumn')}
                </button>
              </div>

              {mappings.map((mapping, index) => {
                const fieldInfo = STANDARD_FIELDS.find(f => f.value === mapping.field)
                
                return (
                  <div key={index} className="flex gap-4 items-start p-5 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {tColumnMapping('field')}
                        </label>
                        {mapping.field && !STANDARD_FIELDS.find(f => f.value === mapping.field) ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={mapping.field}
                              onChange={(e) => updateMapping(index, { field: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-gray-900 placeholder-gray-400"
                              placeholder={tColumnMapping('customFieldName')}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const availableField = STANDARD_FIELDS.find(f => !mappings.some(m => m.field === f.value && m !== mapping))
                                updateMapping(index, { field: availableField?.value || 'code' })
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-700"
                            >
                              {tColumnMapping('useStandardField')}
                            </button>
                          </div>
                        ) : (
                          <Select
                            value={mapping.field || '__placeholder__'}
                            onValueChange={(value) => handleFieldChange(index, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={tColumnMapping('selectField')} />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableFields(mapping.field).map(field => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                </SelectItem>
                              ))}
                              <SelectItem value="__custom__">{tColumnMapping('customField')}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {fieldInfo && (
                          <p className="text-xs text-gray-500 mt-1">{fieldInfo.description}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {tColumnMapping('excelColumn')}
                        </label>
                        <input
                          type="text"
                          value={mapping.column}
                          onChange={(e) => updateMapping(index, { column: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-gray-900 placeholder-gray-400"
                          placeholder={tColumnMapping('columnPlaceholder')}
                        />
                        <p className="text-xs text-gray-500 mt-1.5">{tColumnMapping('columnDescription')}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMapping(index)}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-8"
                      title={tColumnMapping('removeMapping')}
                      disabled={mappings.length === 1}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                {tColumnMapping('tip')}
              </p>
              <ul className="text-sm text-blue-800 space-y-1.5 list-disc list-inside">
                <li>{tColumnMapping('tip1')}</li>
                <li>{tColumnMapping('tip2')}</li>
                <li>{tColumnMapping('tip3')}</li>
                <li>{tColumnMapping('tip4')}</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                const existing = catalog.column_mappings
                if (existing?.mappings && Array.isArray(existing.mappings) && existing.mappings.length > 0) {
                  setMappings(existing.mappings)
                } else {
                  // Convert legacy format or initialize with defaults
                  const newMappings: ColumnMappingField[] = []
                  if (existing?.code) newMappings.push({ field: 'code', column: existing.code })
                  if (existing?.name) newMappings.push({ field: 'name', column: existing.name })
                  if (existing?.unit) newMappings.push({ field: 'unit', column: existing.unit })
                  if (existing?.category) newMappings.push({ field: 'category', column: existing.category })
                  if (existing?.price) newMappings.push({ field: 'price', column: existing.price })
                  if (existing?.description) newMappings.push({ field: 'description', column: existing.description })
                  
                  setMappings(newMappings)
                }
                setHeaderRow(existing?.headerRow ?? 0)
                setExcelFile(null)
                setSelectedColumns(new Set())
                setError(null)
                setSuccess(false)
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? tColumnMapping('saving') : tColumnMapping('saveMappings')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
