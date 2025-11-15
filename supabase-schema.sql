  -- Enable UUID extension
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Reference Items Table (from Excel uploads)
  CREATE TABLE IF NOT EXISTS reference_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    price DECIMAL(10, 2),
    unit TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, code)
  );

  -- Lists Table
  CREATE TABLE IF NOT EXISTS lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- List Items Table
  CREATE TABLE IF NOT EXISTS list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    reference_item_id UUID REFERENCES reference_items(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_reference_items_user_id ON reference_items(user_id);
  CREATE INDEX IF NOT EXISTS idx_reference_items_code ON reference_items(code);
  CREATE INDEX IF NOT EXISTS idx_reference_items_name ON reference_items(name);
  CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
  CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);

  -- Enable Row Level Security
  ALTER TABLE reference_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
  ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

  -- RLS Policies for reference_items
  CREATE POLICY "Users can view their own reference items"
    ON reference_items FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own reference items"
    ON reference_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own reference items"
    ON reference_items FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own reference items"
    ON reference_items FOR DELETE
    USING (auth.uid() = user_id);

  -- RLS Policies for lists
  CREATE POLICY "Users can view their own lists"
    ON lists FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own lists"
    ON lists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own lists"
    ON lists FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own lists"
    ON lists FOR DELETE
    USING (auth.uid() = user_id);

  -- RLS Policies for list_items
  CREATE POLICY "Users can view list items from their own lists"
    ON list_items FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM lists
        WHERE lists.id = list_items.list_id
        AND lists.user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can insert list items into their own lists"
    ON list_items FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM lists
        WHERE lists.id = list_items.list_id
        AND lists.user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can update list items in their own lists"
    ON list_items FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM lists
        WHERE lists.id = list_items.list_id
        AND lists.user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can delete list items from their own lists"
    ON list_items FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM lists
        WHERE lists.id = list_items.list_id
        AND lists.user_id = auth.uid()
      )
    );

