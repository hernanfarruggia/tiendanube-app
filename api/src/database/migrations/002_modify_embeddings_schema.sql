-- Modify product_embeddings to work without products table
-- This migration makes product_embeddings independent by storing product_id directly

-- Step 1: Drop the foreign key constraint first (before changing types)
ALTER TABLE product_embeddings
  DROP CONSTRAINT IF EXISTS product_embeddings_product_id_fkey;

-- Step 2: Drop the old unique constraint
ALTER TABLE product_embeddings
  DROP CONSTRAINT IF EXISTS product_embeddings_product_id_language_key;

-- Step 3: Add store_user_id column
ALTER TABLE product_embeddings
  ADD COLUMN IF NOT EXISTS store_user_id INTEGER;

-- Step 4: Change product_id from INTEGER to VARCHAR
-- Note: This will fail if there's existing data with product_id as INTEGER
-- In that case, we need to migrate the data first
DO $$
BEGIN
  -- Check if product_id is currently INTEGER
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_embeddings'
    AND column_name = 'product_id'
    AND data_type = 'integer'
  ) THEN
    -- Change type from INTEGER to VARCHAR
    ALTER TABLE product_embeddings ALTER COLUMN product_id TYPE VARCHAR(100);
  END IF;
END $$;

-- Step 5: Add the new unique constraint
ALTER TABLE product_embeddings
  ADD CONSTRAINT product_embeddings_unique
  UNIQUE(store_user_id, product_id, language);

-- Step 6: Add index for store_user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_product_embeddings_store_user
  ON product_embeddings(store_user_id);

-- Products table is kept for now but not required for embeddings
-- If you want to drop it completely, uncomment the line below:
-- DROP TABLE IF EXISTS products CASCADE;
