-- COMPLETE FIX FOR GLIDEBASE SYNC ISSUES
-- This script provides a comprehensive solution for gl_estimate_lines sync

-- STEP 1: Drop all foreign key constraints
DO $$
DECLARE
    constraint_record record;
BEGIN
    FOR constraint_record IN 
        SELECT conname, conrelid::regclass::text as table_name
        FROM pg_constraint
        WHERE conrelid = 'public.gl_estimate_lines'::regclass
        AND contype = 'f'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', 
                      constraint_record.table_name, constraint_record.conname);
        
        RAISE NOTICE 'Dropped foreign key constraint % on %', 
                    constraint_record.conname, constraint_record.table_name;
    END LOOP;
END $$;

-- STEP 2: Create a completely self-contained sync function that doesn't rely on triggers or session parameters
CREATE OR REPLACE FUNCTION public.glsync_estimate_lines_complete(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Use security definer to bypass RLS policies
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

-- STEP 3: Grant execute permissions to the function
GRANT EXECUTE ON FUNCTION public.glsync_estimate_lines_complete(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.glsync_estimate_lines_complete(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.glsync_estimate_lines_complete(jsonb) TO anon;

-- STEP 4: Create a function to verify and fix any data inconsistencies
CREATE OR REPLACE FUNCTION public.fix_gl_estimate_lines_data()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    fixed_count int := 0;
    rows_affected int := 0;
BEGIN
    -- Create missing estimates
    INSERT INTO public.gl_estimates (glide_row_id, created_at, updated_at)
    SELECT DISTINCT el.rowid_estimates, now(), now()
    FROM public.gl_estimate_lines el
    LEFT JOIN public.gl_estimates e ON el.rowid_estimates = e.glide_row_id
    WHERE el.rowid_estimates IS NOT NULL
      AND e.glide_row_id IS NULL;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    fixed_count := fixed_count + rows_affected;
    
    -- Create missing products
    INSERT INTO public.gl_products (glide_row_id, created_at, updated_at)
    SELECT DISTINCT el.rowid_products, now(), now()
    FROM public.gl_estimate_lines el
    LEFT JOIN public.gl_products p ON el.rowid_products = p.glide_row_id
    WHERE el.rowid_products IS NOT NULL
      AND p.glide_row_id IS NULL;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    fixed_count := fixed_count + rows_affected;
    
    -- Fix display names
    UPDATE public.gl_estimate_lines el
    SET display_name = COALESCE(
        el.sale_product_name,
        p.new_product_name,
        p.vendor_product_name,
        'Product ' || el.rowid_products,
        'Unnamed Product'
    )
    FROM public.gl_products p
    WHERE el.rowid_products = p.glide_row_id
    AND (el.display_name IS NULL OR el.display_name = '');
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    fixed_count := fixed_count + rows_affected;
    
    -- Update all estimate totals
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
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    fixed_count := fixed_count + rows_affected;
    
    RETURN 'Fixed ' || fixed_count || ' data inconsistencies';
END;
$$;

-- STEP 5: Grant execute permissions to the fix function
GRANT EXECUTE ON FUNCTION public.fix_gl_estimate_lines_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_gl_estimate_lines_data() TO service_role;

-- STEP 6: Run the fix function to ensure data is consistent
SELECT public.fix_gl_estimate_lines_data();
