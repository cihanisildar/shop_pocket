'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ExcelPreviewProps {
  file: File | null
  headerRow: number
  onColumnSelect: (columnIndex: number, columnLetter: string, headerName: string) => void
  selectedColumns: Set<number>
}

export default function ExcelPreview({ file, headerRow, onColumnSelect, selectedColumns }: ExcelPreviewProps) {
  const t = useTranslations('excel')
  const [data, setData] = useState<any[][]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewRows, setPreviewRows] = useState(10)

  useEffect(() => {
    if (!file) {
      setData([])
      return
    }

    setLoading(true)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]
        
        if (!jsonData || jsonData.length === 0) {
          setError(t('excelFileEmpty'))
          return
        }

        setData(jsonData)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('failedToReadExcelFile'))
      } finally {
        setLoading(false)
      }
    }

    reader.onerror = () => {
      setError(t('failedToReadFile'))
      setLoading(false)
    }

    reader.readAsArrayBuffer(file)
  }, [file])

  const columnIndexToLetter = (index: number): string => {
    let letter = ''
    let num = index
    while (num >= 0) {
      letter = String.fromCharCode(65 + (num % 26)) + letter
      num = Math.floor(num / 26) - 1
    }
    return letter
  }

  if (!file) {
    return (
      <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
        {t('uploadExcelToPreview')}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        {t('loadingExcelFile')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
        {error}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        {t('noDataFound')}
      </div>
    )
  }

  const maxColumns = Math.max(...data.map(row => row.length), 0)
  const headerRowData = data[headerRow] || []
  const displayRows = data.slice(0, Math.min(previewRows + 1, data.length))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {t('clickColumnHeaders', { count: previewRows })}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewRows(Math.max(5, previewRows - 5))}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
            title={t('showFewerRows')}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">{previewRows} {t('rows')}</span>
          <button
            type="button"
            onClick={() => setPreviewRows(Math.min(50, previewRows + 5))}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
            title={t('showMoreRows')}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-auto max-h-[500px] bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {/* Column letter row */}
              <th className="border border-gray-300 bg-gray-100 p-2 text-xs font-semibold text-gray-600 w-12 sticky left-0 z-20">
                #
              </th>
              {Array.from({ length: maxColumns }, (_, i) => {
                const columnLetter = columnIndexToLetter(i)
                const isSelected = selectedColumns.has(i)
                return (
                  <th
                    key={i}
                    onClick={() => {
                      const headerName = headerRowData[i]?.toString().trim() || ''
                      onColumnSelect(i, columnLetter, headerName)
                    }}
                    className={`
                      border border-gray-300 p-2 text-xs font-semibold text-center cursor-pointer transition-colors min-w-[120px]
                      ${isSelected 
                        ? 'bg-indigo-100 text-indigo-900 border-indigo-400' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    title={t('clickToSelectColumn', { letter: columnLetter })}
                  >
                    <div className="font-mono text-xs mb-1">{columnLetter}</div>
                    <div className="text-xs font-normal break-words">
                      {headerRowData[i]?.toString().trim() || `${t('column')} ${columnLetter}`}
                    </div>
                    {isSelected && (
                      <div className="mt-1 text-xs text-indigo-600">✓ {t('selected')}</div>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex === headerRow ? 'bg-blue-50' : ''}>
                <td className="border border-gray-300 bg-gray-100 p-2 text-xs font-semibold text-gray-600 sticky left-0 z-10">
                  {rowIndex + 1}
                </td>
                {Array.from({ length: maxColumns }, (_, colIndex) => {
                  const cellValue = row[colIndex]
                  const isHeaderRow = rowIndex === headerRow
                  return (
                    <td
                      key={colIndex}
                      className={`
                        border border-gray-300 p-2 text-xs
                        ${isHeaderRow ? 'bg-blue-50 font-semibold' : 'bg-white'}
                        ${selectedColumns.has(colIndex) ? 'bg-indigo-50' : ''}
                      `}
                    >
                      {cellValue?.toString().trim() || ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

