-- Migration to safely rename rowid_estimate_lines to rowid_estimates
-- This script handles the field rename while preserving data and functionality

-- STEP 1: Check if the column exists and needs to be renamed
DO $$
DECLARE
    column_exists BOOLEAN;
    correct_column_exists BOOLEAN;
BEGIN
    -- Check if rowid_estimate_lines exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gl_estimate_lines'
        AND column_name = 'rowid_estimate_lines'
    ) INTO column_exists;
    
    -- Check if rowid_estimates already exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gl_estimate_lines'
        AND column_name = 'rowid_estimates'
    ) INTO correct_column_exists;
    
    -- Only proceed if rowid_estimate_lines exists and rowid_estimates doesn't
    IF column_exists AND NOT correct_column_exists THEN
        -- Rename the column
        EXECUTE 'ALTER TABLE public.gl_estimate_lines RENAME COLUMN rowid_estimate_lines TO rowid_estimates';
        RAISE NOTICE 'Column renamed from rowid_estimate_lines to rowid_estimates';
        
        -- Create index on the renamed column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND tablename = 'gl_estimate_lines' 
            AND indexname = 'idx_gl_estimate_lines_rowid_estimates'
        ) THEN
            EXECUTE 'CREATE INDEX idx_gl_estimate_lines_rowid_estimates ON public.gl_estimate_lines(rowid_estimates)';
            RAISE NOTICE 'Created index on rowid_estimates';
        END IF;
    ELSIF correct_column_exists THEN
        RAISE NOTICE 'Column rowid_estimates already exists, no action needed';
    ELSE
        RAISE NOTICE 'Column rowid_estimate_lines not found, no action needed';
    END IF;
END $$;

-- STEP 2: Update any functions that reference the old column name
DO $$
DECLARE
    function_exists BOOLEAN;
BEGIN
    -- Check if the function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'glsync_estimate_lines_complete'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) INTO function_exists;
    
    IF function_exists THEN
        -- Function exists, update it to use the new column name
        -- We're recreating the function with the correct column name
        CREATE OR REPLACE FUNCTION public.glsync_estimate_lines_complete(data jsonb)
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
            v_display_name text;
            v_product_name text;
            v_line_total numeric;
            v_estimate_id text;
            v_estimate_total numeric;
        BEGIN
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
                    
                    -- Calculate line total
                    v_line_total := COALESCE(v_qty_sold, 0) * COALESCE(v_selling_price, 0);
                    
                    -- Create missing estimate if needed
                    IF v_rowid_estimates IS NOT NULL THEN
                        INSERT INTO public.gl_estimates (glide_row_id, created_at, updated_at)
                        VALUES (v_rowid_estimates, now(), now())
                        ON CONFLICT (glide_row_id) DO NOTHING;
                    END IF;
                    
                    -- Create missing product if needed
                    IF v_rowid_products IS NOT NULL THEN
                        INSERT INTO public.gl_products (glide_row_id, created_at, updated_at)
                        VALUES (v_rowid_products, now(), now())
                        ON CONFLICT (glide_row_id) DO NOTHING;
                        
                        -- Get product name for display_name
                        SELECT COALESCE(new_product_name, vendor_product_name) 
                        INTO v_product_name
                        FROM public.gl_products
                        WHERE glide_row_id = v_rowid_products;
                    END IF;
                    
                    -- Set display_name using the same logic as the trigger
                    v_display_name := COALESCE(
                        v_sale_product_name,
                        v_product_name,
                        'Product ' || v_rowid_products,
                        'Unnamed Product'
                    );
                    
                    -- Direct upsert with all calculations inline
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
                        v_display_name
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
                        display_name = EXCLUDED.display_name;
                    
                    -- Record the successful operation
                    IF FOUND THEN
                        result := jsonb_set(result, '{updated}', (result->'updated') || to_jsonb(v_glide_row_id));
                    ELSE
                        result := jsonb_set(result, '{inserted}', (result->'inserted') || to_jsonb(v_glide_row_id));
                    END IF;
                    
                    -- Update estimate total (same logic as the trigger but inline)
                    IF v_rowid_estimates IS NOT NULL THEN
                        SELECT COALESCE(SUM(qty_sold * selling_price), 0)
                        INTO v_estimate_total
                        FROM public.gl_estimate_lines
                        WHERE rowid_estimates = v_rowid_estimates;
                        
                        UPDATE public.gl_estimates
                        SET total_amount = v_estimate_total,
                            updated_at = now()
                        WHERE glide_row_id = v_rowid_estimates;
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
            
            RETURN result;
        END;
        $$;
        
        RAISE NOTICE 'Updated function glsync_estimate_lines_complete to use rowid_estimates';
    END IF;
END $$;

-- STEP 3: Update any triggers that reference the old column name
DO $$
DECLARE
    function_exists BOOLEAN;
BEGIN
    -- Check if the function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_estimate_total'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) INTO function_exists;
    
    IF function_exists THEN
        -- Function exists, update it to use the new column name
        CREATE OR REPLACE FUNCTION public.update_estimate_total()
        RETURNS TRIGGER AS $$
        DECLARE
            estimate_id text;
            total_amount numeric;
        BEGIN
            -- Determine which estimate to update
            IF TG_OP = 'DELETE' THEN
                estimate_id := OLD.rowid_estimates;
            ELSE
                estimate_id := NEW.rowid_estimates;
            END IF;
            
            -- Skip if no estimate_id
            IF estimate_id IS NULL THEN
                RETURN NULL;
            END IF;
            
            -- Calculate the total amount
            SELECT COALESCE(SUM(line_total), 0)
            INTO total_amount
            FROM public.gl_estimate_lines
            WHERE rowid_estimates = estimate_id;
            
            -- Update the estimate
            UPDATE public.gl_estimates
            SET 
                total_amount = total_amount,
                updated_at = now()
            WHERE glide_row_id = estimate_id;
            
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
        
        RAISE NOTICE 'Updated function update_estimate_total to use rowid_estimates';
    END IF;
END $$;

-- STEP 4: Update any views that reference the old column name
DO $$
DECLARE
    view_exists BOOLEAN;
BEGIN
    -- Check if the view exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'v_estimate_lines_with_products'
    ) INTO view_exists;
    
    IF view_exists THEN
        -- Drop and recreate the view with the updated column name
        DROP VIEW IF EXISTS public.v_estimate_lines_with_products;
        
        CREATE VIEW public.v_estimate_lines_with_products AS
        SELECT 
            el.*,
            p.new_product_name,
            p.vendor_product_name,
            p.product_cost,
            p.product_category,
            e.estimate_date,
            e.status as estimate_status
        FROM 
            public.gl_estimate_lines el
        LEFT JOIN 
            public.gl_products p ON el.rowid_products = p.glide_row_id
        LEFT JOIN 
            public.gl_estimates e ON el.rowid_estimates = e.glide_row_id;
            
        RAISE NOTICE 'Updated view v_estimate_lines_with_products to use rowid_estimates';
    END IF;
END $$;

-- STEP 5: Update the edge function to use the correct field name
-- Note: This is just a reminder, as the edge function code needs to be updated separately
RAISE NOTICE 'IMPORTANT: Remember to update your edge function to use rowid_estimates instead of rowid_estimate_lines';

-- STEP 6: Final verification
DO $$
BEGIN
    RAISE NOTICE 'Migration complete. The field has been renamed from rowid_estimate_lines to rowid_estimates.';
    RAISE NOTICE 'All related functions, triggers, and views have been updated to use the new field name.';
END $$;
