export interface ColumnMappingField {
  field: string  // Field name (code, name, unit, etc.)
  column: string  // Column letter (A, B, C) or header name
}

export interface ColumnMapping {
  headerRow?: number  // Which row contains headers (0-indexed, default 0)
  mappings?: ColumnMappingField[]  // Dynamic list of field-to-column mappings
  // Legacy support - keep these for backward compatibility
  code?: string
  name?: string
  unit?: string
  category?: string
  price?: string
  description?: string
}

export interface Catalog {
  id: string
  user_id: string
  name: string
  description?: string
  column_mappings?: ColumnMapping
  created_at: string
  updated_at: string
}

export interface ReferenceItem {
  id?: string
  catalog_id?: string
  code: string
  name: string
  category?: string
  price?: number
  unit?: string
  description?: string
}

export interface ListItem {
  id?: string
  list_id: string
  reference_item_id?: string
  code: string
  name: string
  quantity: number
  unit?: string
  notes?: string
  created_at?: string
}

export interface UserList {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  items?: ListItem[]
}

