-- EMERGENCY FIX FOR GL_ESTIMATE_LINES SYNC
-- This script takes a more aggressive approach to fix sync issues

-- STEP 1: Drop all constraints and triggers that might interfere with sync
DO $$
DECLARE
    trigger_record record;
    constraint_record record;
BEGIN
    -- Drop all triggers on gl_estimate_lines
    FOR trigger_record IN 
        SELECT tgname
        FROM pg_trigger
        WHERE tgrelid = 'public.gl_estimate_lines'::regclass
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.gl_estimate_lines', 
                      trigger_record.tgname);
        
        RAISE NOTICE 'Dropped trigger % on gl_estimate_lines', 
                    trigger_record.tgname;
    END LOOP;
    
    -- Drop all foreign key constraints on gl_estimate_lines
    FOR constraint_record IN 
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.gl_estimate_lines'::regclass
        AND contype = 'f'
    LOOP
        EXECUTE format('ALTER TABLE public.gl_estimate_lines DROP CONSTRAINT IF EXISTS %I', 
                      constraint_record.conname);
        
        RAISE NOTICE 'Dropped foreign key constraint % on gl_estimate_lines', 
                    constraint_record.conname;
    END LOOP;
END $$;

-- STEP 2: Create a simplified direct sync function with no dependencies
CREATE OR REPLACE FUNCTION public.glsync_estimate_lines_direct(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item jsonb;
    v_glide_row_id text;
    v_rowid_estimates text;
    v_rowid_products text;
    v_sale_product_name text;
    v_qty_sold numeric;
    v_selling_price numeric;
    v_product_sale_note text;
    v_date_of_sale timestamp with time zone;
    v_created_at timestamp with time zone;
    v_updated_at timestamp with time zone;
    result jsonb := '{"inserted": [], "updated": [], "errors": []}'::jsonb;
BEGIN
    -- Disable all triggers
    SET session_replication_role = 'replica';
    
    -- Process each item in the data array
    FOR item IN SELECT * FROM jsonb_array_elements(data)
    LOOP
        BEGIN
            -- Extract values from the item
            v_glide_row_id := item->>'glide_row_id';
            v_rowid_estimates := item->>'rowid_estimates';
            v_rowid_products := item->>'rowid_products';
            v_sale_product_name := item->>'sale_product_name';
            v_qty_sold := (item->>'qty_sold')::numeric;
            v_selling_price := (item->>'selling_price')::numeric;
            v_product_sale_note := item->>'product_sale_note';
            v_date_of_sale := (item->>'date_of_sale')::timestamp with time zone;
            v_created_at := COALESCE((item->>'created_at')::timestamp with time zone, now());
            v_updated_at := COALESCE((item->>'updated_at')::timestamp with time zone, now());
            
            -- Direct upsert with minimal logic
            INSERT INTO public.gl_estimate_lines (
                glide_row_id,
                rowid_estimates,
                rowid_products,
                sale_product_name,
                qty_sold,
                selling_price,
                product_sale_note,
                date_of_sale,
                created_at,
                updated_at,
                display_name
            ) VALUES (
                v_glide_row_id,
                v_rowid_estimates,
                v_rowid_products,
                v_sale_product_name,
                v_qty_sold,
                v_selling_price,
                v_product_sale_note,
                v_date_of_sale,
                v_created_at,
                v_updated_at,
                COALESCE(v_sale_product_name, 'Product ' || v_rowid_products, 'Unnamed Product')
            )
            ON CONFLICT (glide_row_id) DO UPDATE SET
                rowid_estimates = EXCLUDED.rowid_estimates,
                rowid_products = EXCLUDED.rowid_products,
                sale_product_name = EXCLUDED.sale_product_name,
                qty_sold = EXCLUDED.qty_sold,
                selling_price = EXCLUDED.selling_price,
                product_sale_note = EXCLUDED.product_sale_note,
                date_of_sale = EXCLUDED.date_of_sale,
                updated_at = now(),
                display_name = COALESCE(EXCLUDED.sale_product_name, 'Product ' || EXCLUDED.rowid_products, 'Unnamed Product');
            
            -- Record the successful operation
            IF FOUND THEN
                result := jsonb_set(result, '{updated}', (result->'updated') || to_jsonb(v_glide_row_id));
            ELSE
                result := jsonb_set(result, '{inserted}', (result->'inserted') || to_jsonb(v_glide_row_id));
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Record the error
            result := jsonb_set(
                result, 
                '{errors}', 
                (result->'errors') || jsonb_build_object(
                    'glide_row_id', v_glide_row_id,
                    'error', SQLERRM,
                    'detail', SQLSTATE
                )
            );
        END;
    END LOOP;
    
    -- Re-enable triggers
    SET session_replication_role = 'origin';
    
    -- Update totals manually after all records are processed
    UPDATE public.gl_estimates e
    SET total_amount = COALESCE(subquery.total, 0)
    FROM (
        SELECT 
            rowid_estimates, 
            SUM(qty_sold * selling_price) as total
        FROM 
            public.gl_estimate_lines
        GROUP BY 
            rowid_estimates
    ) as subquery
    WHERE e.glide_row_id = subquery.rowid_estimates;
    
    RETURN result;
END;
$$;

-- STEP 3: Create missing related records for existing estimate lines
DO $$
BEGIN
    -- Create missing estimates
    INSERT INTO public.gl_estimates (glide_row_id, created_at, updated_at)
    SELECT DISTINCT el.rowid_estimates, now(), now()
    FROM public.gl_estimate_lines el
    LEFT JOIN public.gl_estimates e ON el.rowid_estimates = e.glide_row_id
    WHERE el.rowid_estimates IS NOT NULL
      AND e.glide_row_id IS NULL;
      
    -- Create missing products
    INSERT INTO public.gl_products (glide_row_id, created_at, updated_at)
    SELECT DISTINCT el.rowid_products, now(), now()
    FROM public.gl_estimate_lines el
    LEFT JOIN public.gl_products p ON el.rowid_products = p.glide_row_id
    WHERE el.rowid_products IS NOT NULL
      AND p.glide_row_id IS NULL;
END $$;

-- STEP 4: Grant permissions for the new function
GRANT EXECUTE ON FUNCTION public.glsync_estimate_lines_direct(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.glsync_estimate_lines_direct(jsonb) TO service_role;

-- STEP 5: Create a function to verify table structure is correct
CREATE OR REPLACE FUNCTION public.verify_gl_estimate_lines_structure()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    issues text := '';
    column_exists boolean;
    constraint_exists boolean;
BEGIN
    -- Check for required columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gl_estimate_lines'
        AND column_name = 'glide_row_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        issues := issues || 'Missing required column: glide_row_id. ';
    END IF;
    
    -- Check for unique constraint on glide_row_id
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.gl_estimate_lines'::regclass
        AND conname = 'gl_estimate_lines_glide_row_id_key'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        issues := issues || 'Missing unique constraint on glide_row_id. ';
    END IF;
    
    -- Return results
    IF issues = '' THEN
        RETURN 'Table structure is correct.';
    ELSE
        RETURN 'Issues found: ' || issues;
    END IF;
END;
$$;

-- Run the verification
SELECT public.verify_gl_estimate_lines_structure();
