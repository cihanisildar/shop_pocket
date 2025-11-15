-- Migration: Add catalogs support
-- Run this after the initial schema

-- Create Catalogs Table
CREATE TABLE IF NOT EXISTS catalogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  column_mappings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Add catalog_id to reference_items
ALTER TABLE reference_items 
ADD COLUMN IF NOT EXISTS catalog_id UUID REFERENCES catalogs(id) ON DELETE CASCADE;

-- Update unique constraint to include catalog_id
ALTER TABLE reference_items 
DROP CONSTRAINT IF EXISTS reference_items_user_id_code_key;

ALTER TABLE reference_items 
ADD CONSTRAINT reference_items_user_id_catalog_id_code_key 
UNIQUE(user_id, catalog_id, code);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_catalogs_user_id ON catalogs(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_items_catalog_id ON reference_items(catalog_id);

-- Enable Row Level Security for catalogs
ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for catalogs
CREATE POLICY "Users can view their own catalogs"
  ON catalogs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own catalogs"
  ON catalogs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own catalogs"
  ON catalogs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own catalogs"
  ON catalogs FOR DELETE
  USING (auth.uid() = user_id);

-- Update RLS policies for reference_items to include catalog check
DROP POLICY IF EXISTS "Users can view their own reference items" ON reference_items;
CREATE POLICY "Users can view their own reference items"
  ON reference_items FOR SELECT
  USING (
    auth.uid() = user_id AND
    (catalog_id IS NULL OR EXISTS (
      SELECT 1 FROM catalogs
      WHERE catalogs.id = reference_items.catalog_id
      AND catalogs.user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can insert their own reference items" ON reference_items;
CREATE POLICY "Users can insert their own reference items"
  ON reference_items FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (catalog_id IS NULL OR EXISTS (
      SELECT 1 FROM catalogs
      WHERE catalogs.id = reference_items.catalog_id
      AND catalogs.user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can update their own reference items" ON reference_items;
CREATE POLICY "Users can update their own reference items"
  ON reference_items FOR UPDATE
  USING (
    auth.uid() = user_id AND
    (catalog_id IS NULL OR EXISTS (
      SELECT 1 FROM catalogs
      WHERE catalogs.id = reference_items.catalog_id
      AND catalogs.user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can delete their own reference items" ON reference_items;
CREATE POLICY "Users can delete their own reference items"
  ON reference_items FOR DELETE
  USING (
    auth.uid() = user_id AND
    (catalog_id IS NULL OR EXISTS (
      SELECT 1 FROM catalogs
      WHERE catalogs.id = reference_items.catalog_id
      AND catalogs.user_id = auth.uid()
    ))
  );

