-- Migration: 20250407_fix_gl_estimate_lines_sync.sql
-- Purpose: Fix gl_estimate_lines sync issues where only rowid fields are being synced
-- Date: 2025-04-07

-- This migration ensures that all fields in gl_estimate_lines are properly synced
-- according to the Glidebase pattern, where relationships use rowid_ fields
-- referencing glide_row_id values without foreign key constraints.

-- Step 1: Check for and remove any foreign key constraints on gl_estimate_lines
-- as they are inconsistent with the Glidebase pattern and can cause sync issues
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find foreign key constraints on gl_estimate_lines
    FOR constraint_name IN 
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'gl_estimate_lines'::regclass
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE gl_estimate_lines DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name;
    END LOOP;
END $$;

-- Step 2: Ensure all expected columns exist in gl_estimate_lines
DO $$
BEGIN
    -- Check and add sale_product_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'gl_estimate_lines' AND column_name = 'sale_product_name') THEN
        ALTER TABLE gl_estimate_lines ADD COLUMN sale_product_name text;
        RAISE NOTICE 'Added missing column: sale_product_name';
    END IF;

    -- Check and add qty_sold if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'gl_estimate_lines' AND column_name = 'qty_sold') THEN
        ALTER TABLE gl_estimate_lines ADD COLUMN qty_sold numeric;
        RAISE NOTICE 'Added missing column: qty_sold';
    END IF;

    -- Check and add selling_price if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'gl_estimate_lines' AND column_name = 'selling_price') THEN
        ALTER TABLE gl_estimate_lines ADD COLUMN selling_price numeric;
        RAISE NOTICE 'Added missing column: selling_price';
    END IF;

    -- Check and add product_sale_note if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'gl_estimate_lines' AND column_name = 'product_sale_note') THEN
        ALTER TABLE gl_estimate_lines ADD COLUMN product_sale_note text;
        RAISE NOTICE 'Added missing column: product_sale_note';
    END IF;

    -- Check and add date_of_sale if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'gl_estimate_lines' AND column_name = 'date_of_sale') THEN
        ALTER TABLE gl_estimate_lines ADD COLUMN date_of_sale timestamp with time zone;
        RAISE NOTICE 'Added missing column: date_of_sale';
    END IF;
END $$;

-- Step 3: Ensure proper indexes exist for relationship fields
DO $$
BEGIN
    -- Create index on rowid_estimates if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'gl_estimate_lines' AND indexname = 'idx_gl_estimate_lines_rowid_estimates') THEN
        CREATE INDEX idx_gl_estimate_lines_rowid_estimates ON gl_estimate_lines (rowid_estimates);
        RAISE NOTICE 'Created index: idx_gl_estimate_lines_rowid_estimates';
    END IF;

    -- Create index on rowid_products if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'gl_estimate_lines' AND indexname = 'idx_gl_estimate_lines_rowid_products') THEN
        CREATE INDEX idx_gl_estimate_lines_rowid_products ON gl_estimate_lines (rowid_products);
        RAISE NOTICE 'Created index: idx_gl_estimate_lines_rowid_products';
    END IF;

    -- Create index on glide_row_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'gl_estimate_lines' AND indexname = 'idx_gl_estimate_lines_glide_row_id') THEN
        CREATE UNIQUE INDEX idx_gl_estimate_lines_glide_row_id ON gl_estimate_lines (glide_row_id);
        RAISE NOTICE 'Created index: idx_gl_estimate_lines_glide_row_id';
    END IF;
END $$;

-- Step 4: Update gl_mappings table to ensure all fields are included in the mapping
UPDATE gl_mappings
SET field_mappings = jsonb_build_object(
    'glide_row_id', 'glide_row_id',
    'rowid_estimates', 'rowid_estimates',
    'rowid_products', 'rowid_products',
    'sale_product_name', 'sale_product_name',
    'qty_sold', 'qty_sold',
    'selling_price', 'selling_price',
    'product_sale_note', 'product_sale_note',
    'date_of_sale', 'date_of_sale'
)
WHERE supabase_table = 'gl_estimate_lines'
AND (field_mappings IS NULL OR field_mappings = '{}'::jsonb OR field_mappings::text = '{}');

-- Step 5: Add a comment to the table documenting the Glidebase pattern
COMMENT ON TABLE gl_estimate_lines IS 'Estimate line items. Uses Glidebase pattern where relationships use rowid_ fields referencing glide_row_id values without foreign key constraints.';
