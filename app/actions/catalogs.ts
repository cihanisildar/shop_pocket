'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Catalog } from '@/lib/types'

export async function createCatalog(name: string, description?: string): Promise<{ error?: string; data?: Catalog }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('catalogs')
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
  revalidatePath('/reference-items')
  return { data: data as Catalog }
}

export async function getCatalogs(): Promise<{ error?: string; data?: Catalog[] }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('catalogs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data: data as Catalog[] }
}

export async function updateCatalog(
  catalogId: string, 
  updates: { name?: string; description?: string; column_mappings?: any }
): Promise<{ error?: string; data?: Catalog }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify catalog belongs to user
  const { data: existingCatalog } = await supabase
    .from('catalogs')
    .select('id')
    .eq('id', catalogId)
    .eq('user_id', user.id)
    .single()

  if (!existingCatalog) {
    return { error: 'Catalog not found' }
  }

  const updateData: any = {}
  if (updates.name !== undefined) updateData.name = updates.name.trim()
  if (updates.description !== undefined) updateData.description = updates.description?.trim() || null
  if (updates.column_mappings !== undefined) updateData.column_mappings = updates.column_mappings
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('catalogs')
    .update(updateData)
    .eq('id', catalogId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/reference-items')
  return { data: data as Catalog }
}

export async function deleteCatalog(catalogId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify catalog belongs to user
  const { data: existingCatalog } = await supabase
    .from('catalogs')
    .select('id')
    .eq('id', catalogId)
    .eq('user_id', user.id)
    .single()

  if (!existingCatalog) {
    return { error: 'Catalog not found' }
  }

  const { error } = await supabase
    .from('catalogs')
    .delete()
    .eq('id', catalogId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/reference-items')
  return {}
}

