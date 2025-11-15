'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserList, ListItem, ReferenceItem } from '@/lib/types'

export async function createList(name: string, description?: string): Promise<{ error?: string; data?: UserList }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('lists')
    .insert({
      user_id: user.id,
      name,
      description,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { data }
}

export async function getLists(): Promise<{ error?: string; data?: UserList[] }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('lists')
    .select('*, list_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  // Map list_items to items for consistency with the type
  const mappedData = (data || []).map((list: any) => ({
    ...list,
    items: list.list_items || []
  }))

  return { data: mappedData as UserList[] }
}

export async function deleteList(listId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', listId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/lists')
  return {}
}

export async function addListItem(
  listId: string,
  item: { code: string; name: string; quantity: number; unit?: string; notes?: string }
): Promise<{ error?: string; data?: ListItem }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify list belongs to user
  const { data: list } = await supabase
    .from('lists')
    .select('id')
    .eq('id', listId)
    .eq('user_id', user.id)
    .single()

  if (!list) {
    return { error: 'List not found' }
  }

  // Check if item with same code already exists in this list
  // Get ALL items with the same code (handles duplicates)
  const { data: existingItems, error: checkError } = await supabase
    .from('list_items')
    .select('*')
    .eq('list_id', listId)
    .eq('code', item.code)

  if (checkError) {
    return { error: checkError.message }
  }

  // If there are existing items with the same code, consolidate them
  if (existingItems && existingItems.length > 0) {
    // Sum up all quantities from existing items
    const totalQuantity = existingItems.reduce((sum, existingItem) => {
      return sum + (existingItem.quantity || 1)
    }, 0)
    
    const firstItem = existingItems[0]
    const targetId = firstItem.id
    
    // Update the first item with consolidated quantity + new quantity
    const { data, error } = await supabase
      .from('list_items')
      .update({
        quantity: totalQuantity + item.quantity,
        name: item.name,
        unit: item.unit || firstItem.unit,
        notes: item.notes || firstItem.notes,
      })
      .eq('id', targetId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Delete any other duplicates (if there were multiple)
    if (existingItems.length > 1) {
      const duplicateIds = existingItems.slice(1).map(i => i.id).filter(Boolean)
      if (duplicateIds.length > 0) {
        await supabase
          .from('list_items')
          .delete()
          .in('id', duplicateIds)
      }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/lists/${listId}`)
    return { data }
  }

  // No existing items, insert new one
  const { data, error } = await supabase
    .from('list_items')
    .insert({
      list_id: listId,
      code: item.code,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/lists/${listId}`)
  return { data }
}

export async function updateListItem(
  itemId: string,
  updates: { quantity?: number; notes?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify item belongs to user's list
  const { data: item } = await supabase
    .from('list_items')
    .select('list_id, lists!inner(user_id)')
    .eq('id', itemId)
    .single()

  if (!item || (item.lists as any).user_id !== user.id) {
    return { error: 'Item not found' }
  }

  const { error } = await supabase
    .from('list_items')
    .update(updates)
    .eq('id', itemId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return {}
}

export async function deleteListItem(itemId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify item belongs to user's list
  const { data: item } = await supabase
    .from('list_items')
    .select('list_id, lists!inner(user_id)')
    .eq('id', itemId)
    .single()

  if (!item || (item.lists as any).user_id !== user.id) {
    return { error: 'Item not found' }
  }

  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return {}
}

export async function uploadReferenceItems(
  items: ReferenceItem[], 
  catalogId: string,
  mode: 'merge' | 'replace' = 'replace'
): Promise<{ error?: string; count?: number }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify catalog belongs to user
  const { data: catalog } = await supabase
    .from('catalogs')
    .select('id')
    .eq('id', catalogId)
    .eq('user_id', user.id)
    .single()

  if (!catalog) {
    return { error: 'Catalog not found' }
  }

  // Remove duplicates by code (keep the last occurrence)
  const uniqueItemsMap = new Map<string, ReferenceItem>()
  for (const item of items) {
    if (item.code) {
      uniqueItemsMap.set(item.code.trim(), item)
    }
  }
  const uniqueItems = Array.from(uniqueItemsMap.values())

  // If replace mode, delete existing items in this catalog
  if (mode === 'replace') {
    const { error: deleteError } = await supabase
    .from('reference_items')
    .delete()
    .eq('user_id', user.id)
      .eq('catalog_id', catalogId)

    if (deleteError) {
      return { error: `Failed to clear existing items: ${deleteError.message}` }
    }
  }

  // Prepare items for insertion/update
  const itemsToInsert = uniqueItems.map(item => ({
    user_id: user.id,
    catalog_id: catalogId,
    code: item.code.trim(),
    name: item.name.trim(),
    category: item.category?.trim() || null,
    price: item.price || null,
    unit: item.unit?.trim() || null,
    description: item.description?.trim() || null,
  }))

  // Insert in batches, using upsert for merge mode
  const batchSize = 100
  let insertedCount = 0

  for (let i = 0; i < itemsToInsert.length; i += batchSize) {
    const batch = itemsToInsert.slice(i, i + batchSize)
    
    if (mode === 'merge') {
      // Use upsert to update existing items or insert new ones
      const { error } = await supabase
        .from('reference_items')
        .upsert(batch, {
          onConflict: 'user_id,catalog_id,code',
          ignoreDuplicates: false
        })

      if (error) {
        return { error: `Failed to merge items: ${error.message}` }
      }
    } else {
      // Insert new items
      const { error } = await supabase
    .from('reference_items')
        .insert(batch)

  if (error) {
        return { error: `Failed to insert items: ${error.message}` }
      }
    }

    insertedCount += batch.length
  }

  revalidatePath('/dashboard')
  revalidatePath('/reference-items')
  return { count: insertedCount }
}

export async function getReferenceItems(
  catalogId?: string, 
  search?: string, 
  category?: string
): Promise<{ error?: string; data?: ReferenceItem[] }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  let query = supabase
    .from('reference_items')
    .select('*')
    .eq('user_id', user.id)

  if (catalogId) {
    query = query.eq('catalog_id', catalogId)
  } else {
    // If no catalog specified, return empty (user must select a catalog)
    return { data: [] }
  }

  if (search) {
    query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
  }

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query.order('name')

  if (error) {
    return { error: error.message }
  }

  return { data: data as ReferenceItem[] }
}

export async function addReferenceItem(
  item: Omit<ReferenceItem, 'id'>, 
  catalogId: string
): Promise<{ error?: string; data?: ReferenceItem }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify catalog belongs to user
  const { data: catalog } = await supabase
    .from('catalogs')
    .select('id')
    .eq('id', catalogId)
    .eq('user_id', user.id)
    .single()

  if (!catalog) {
    return { error: 'Catalog not found' }
  }

  const { data, error } = await supabase
    .from('reference_items')
    .insert({
      user_id: user.id,
      catalog_id: catalogId,
      code: item.code.trim(),
      name: item.name.trim(),
      category: item.category?.trim() || null,
      price: item.price || null,
      unit: item.unit?.trim() || null,
      description: item.description?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/reference-items')
  return { data: data as ReferenceItem }
}

export async function updateReferenceItem(itemId: string, updates: Partial<Omit<ReferenceItem, 'id'>>): Promise<{ error?: string; data?: ReferenceItem }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify item belongs to user
  const { data: existingItem } = await supabase
    .from('reference_items')
    .select('id')
    .eq('id', itemId)
    .eq('user_id', user.id)
    .single()

  if (!existingItem) {
    return { error: 'Item not found' }
  }

  const updateData: any = {}
  if (updates.code !== undefined) updateData.code = updates.code.trim()
  if (updates.name !== undefined) updateData.name = updates.name.trim()
  if (updates.category !== undefined) updateData.category = updates.category?.trim() || null
  if (updates.price !== undefined) updateData.price = updates.price || null
  if (updates.unit !== undefined) updateData.unit = updates.unit?.trim() || null
  if (updates.description !== undefined) updateData.description = updates.description?.trim() || null
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('reference_items')
    .update(updateData)
    .eq('id', itemId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/reference-items')
  return { data: data as ReferenceItem }
}

export async function deleteReferenceItem(itemId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('reference_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/reference-items')
  return {}
}

