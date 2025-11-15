import * as XLSX from 'xlsx'
import type { ColumnMapping } from './types'

export interface ParsedExcelData {
  referenceItems: Array<{
    code: string
    name: string
    category?: string
    price?: number
    unit?: string
    description?: string
  }>
  listItems?: Array<{
    code: string
    name: string
    quantity: number
    unit?: string
  }>
}

// Convert column letter (A, B, C) to index (0, 1, 2)
function columnLetterToIndex(letter: string): number {
  const upper = letter.toUpperCase().trim()
  let index = 0
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 'A'.charCodeAt(0) + 1)
  }
  return index - 1
}

// Find column index by header name
function findColumnByHeader(
  jsonData: any[][],
  headerRowIndex: number,
  headerName: string
): number {
  const headerRow = jsonData[headerRowIndex] || []
  const searchName = headerName.toLowerCase().trim()
  
  for (let i = 0; i < headerRow.length; i++) {
    const cellValue = headerRow[i]?.toString().trim().toLowerCase() || ''
    if (cellValue === searchName) {
      return i
    }
  }
  
  return -1
}

// Get column index from mapping (either letter or header name)
function getColumnIndex(
  jsonData: any[][],
  headerRowIndex: number,
  mapping: string | undefined
): number {
  if (!mapping) return -1
  
  const trimmed = mapping.trim()
  
  // If it's a single letter (A-Z), treat as column letter
  if (/^[A-Z]+$/i.test(trimmed)) {
    return columnLetterToIndex(trimmed)
  }
  
  // Otherwise, treat as header name
  return findColumnByHeader(jsonData, headerRowIndex, trimmed)
}

export function parseExcelFile(
  file: File,
  columnMappings?: ColumnMapping
): Promise<ParsedExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]
        
        if (!jsonData || jsonData.length === 0) {
          reject(new Error('Excel file is empty or has no data'))
          return
        }

        // Determine header row
        const headerRowIndex = columnMappings?.headerRow ?? 0
        
        if (headerRowIndex >= jsonData.length) {
          reject(new Error(`Header row ${headerRowIndex + 1} does not exist in the file`))
          return
        }

        // Build column index map from mappings
        const columnIndexMap: Record<string, number> = {}
        
        // Support both new format (mappings array) and legacy format (individual properties)
        if (columnMappings?.mappings && Array.isArray(columnMappings.mappings)) {
          // New format: dynamic mappings array
          for (const mapping of columnMappings.mappings) {
            if (mapping.column) {
              const index = getColumnIndex(jsonData, headerRowIndex, mapping.column)
              if (index !== -1) {
                columnIndexMap[mapping.field] = index
              }
            }
          }
        } else {
          // Legacy format: individual properties
          if (columnMappings?.code) {
            const index = getColumnIndex(jsonData, headerRowIndex, columnMappings.code)
            if (index !== -1) columnIndexMap.code = index
          }
          if (columnMappings?.name) {
            const index = getColumnIndex(jsonData, headerRowIndex, columnMappings.name)
            if (index !== -1) columnIndexMap.name = index
          }
          if (columnMappings?.unit) {
            const index = getColumnIndex(jsonData, headerRowIndex, columnMappings.unit)
            if (index !== -1) columnIndexMap.unit = index
          }
          if (columnMappings?.category) {
            const index = getColumnIndex(jsonData, headerRowIndex, columnMappings.category)
            if (index !== -1) columnIndexMap.category = index
          }
          if (columnMappings?.price) {
            const index = getColumnIndex(jsonData, headerRowIndex, columnMappings.price)
            if (index !== -1) columnIndexMap.price = index
          }
          if (columnMappings?.description) {
            const index = getColumnIndex(jsonData, headerRowIndex, columnMappings.description)
            if (index !== -1) columnIndexMap.description = index
          }
        }

        // Validate that at least one column is mapped
        if (Object.keys(columnIndexMap).length === 0) {
          reject(new Error(
            `No column mappings found. ` +
            `Please configure at least one column mapping for this catalog.`
          ))
          return
        }

        const referenceItems: ParsedExcelData['referenceItems'] = []
        
        // Parse rows starting after header row
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i] || []
          
          // Extract values using column index map (only for fields that exist in ReferenceItem)
          const code = columnIndexMap.code !== undefined ? (row[columnIndexMap.code]?.toString().trim() || '') : ''
          const name = columnIndexMap.name !== undefined ? (row[columnIndexMap.name]?.toString().trim() || '') : ''
          const unit = columnIndexMap.unit !== undefined ? (row[columnIndexMap.unit]?.toString().trim() || '') : ''
          const category = columnIndexMap.category !== undefined ? (row[columnIndexMap.category]?.toString().trim() || '') : ''
          const priceStr = columnIndexMap.price !== undefined ? (row[columnIndexMap.price]?.toString().trim() || '') : ''
          const description = columnIndexMap.description !== undefined ? (row[columnIndexMap.description]?.toString().trim() || '') : ''
          
          // Parse price
          let price: number | undefined = undefined
          if (priceStr) {
            const parsed = parseFloat(priceStr.replace(/[^\d.-]/g, ''))
            if (!isNaN(parsed)) {
              price = parsed
            }
          }
          
          // Include row if at least one mapped field has data
          const hasData = code || name || unit || category || priceStr || description
          if (!hasData) continue
          
          // Include the row - use mapped values or defaults
          referenceItems.push({
            code: code || `ITEM_${i}`,
            name: name || code || 'Unnamed Item',
            unit: unit || undefined,
            category: category || undefined,
            price: price,
            description: description || undefined,
          })
        }
        
        // Check for duplicates
        const codeCounts = new Map<string, number>()
        referenceItems.forEach(item => {
          codeCounts.set(item.code, (codeCounts.get(item.code) || 0) + 1)
        })
        const duplicates = Array.from(codeCounts.entries()).filter(([_, count]) => count > 1)
        
        if (duplicates.length > 0) {
          console.warn(`Found ${duplicates.length} duplicate codes in Excel file. Duplicates will be removed (keeping last occurrence).`)
        }
        
        console.log(`Parsed ${referenceItems.length} items from Excel file`)
        
        if (referenceItems.length === 0) {
          reject(new Error(`No items found in the Excel file. Found ${jsonData.length} rows.`))
          return
        }
        
        resolve({
          referenceItems,
        })
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}
