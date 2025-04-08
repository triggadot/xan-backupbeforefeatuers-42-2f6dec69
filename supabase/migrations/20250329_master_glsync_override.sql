-- Master Glidebase Sync Override Script
-- This script ensures that glsync functions override all PostgreSQL rules and guarantee proper linkage
-- It follows the Glidebase pattern where relationships use rowid_ fields to reference glide_row_id values

-- PART 1: Create the master control function to disable all constraints and triggers during sync
CREATE OR REPLACE FUNCTION public.glsync_master_control()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Completely disable all triggers during sync operations
  SET session_replication_role = 'replica';
  
  -- Set a session variable to indicate we're in glsync mode
  -- This can be checked by other functions/triggers if needed
  SET LOCAL "app.glsync_mode" = 'true';
  
  -- Log the start of sync mode
  RAISE NOTICE 'GLSYNC: Entering override mode - all constraints and triggers disabled';
END;
$$;

-- PART 2: Create the master cleanup function to re-enable constraints and fix data
CREATE OR REPLACE FUNCTION public.glsync_master_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fixed_records INTEGER := 0;
BEGIN
  -- First, attempt to fix any inconsistent data before re-enabling constraints
  
  -- 1. Fix missing estimate references
  INSERT INTO public.gl_estimates (glide_row_id, created_at, updated_at)
  SELECT DISTINCT el.rowid_estimates, now(), now()
  FROM public.gl_estimate_lines el
  LEFT JOIN public.gl_estimates e ON el.rowid_estimates = e.glide_row_id
  WHERE el.rowid_estimates IS NOT NULL
    AND e.glide_row_id IS NULL;
  
  GET DIAGNOSTICS v_fixed_records = ROW_COUNT;
  IF v_fixed_records > 0 THEN
    RAISE NOTICE 'GLSYNC: Created % missing estimate records', v_fixed_records;
  END IF;
  
  -- 2. Fix missing product references
  INSERT INTO public.gl_products (glide_row_id, created_at, updated_at)
  SELECT DISTINCT el.rowid_products, now(), now()
  FROM public.gl_estimate_lines el
  LEFT JOIN public.gl_products p ON el.rowid_products = p.glide_row_id
  WHERE el.rowid_products IS NOT NULL
    AND p.glide_row_id IS NULL;
  
  GET DIAGNOSTICS v_fixed_records = ROW_COUNT;
  IF v_fixed_records > 0 THEN
    RAISE NOTICE 'GLSYNC: Created % missing product records', v_fixed_records;
  END IF;
  
  -- 3. Update display names
  UPDATE public.gl_estimate_lines el
  SET display_name = COALESCE(
    el.sale_product_name,
    p.new_product_name,
    p.vendor_product_name,
    'Product ' || el.rowid_products
  )
  FROM public.gl_products p
  WHERE el.rowid_products = p.glide_row_id
    AND (el.display_name IS NULL OR el.display_name = '');
  
  GET DIAGNOSTICS v_fixed_records = ROW_COUNT;
  IF v_fixed_records > 0 THEN
    RAISE NOTICE 'GLSYNC: Fixed % missing display names', v_fixed_records;
  END IF;
  
  -- 4. Update estimate totals
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
  
  -- 5. Clear the session variable
  SET LOCAL "app.glsync_mode" = 'false';
  
  -- 6. Re-enable all triggers and constraints
  SET session_replication_role = 'origin';
  
  RAISE NOTICE 'GLSYNC: Exiting override mode - constraints and triggers restored';
END;
$$;

-- PART 3: Create a comprehensive glsync function for estimate lines with proper linkage
CREATE OR REPLACE FUNCTION public.glsync_estimate_lines(data jsonb)
RETURNS jsonb AS $$
DECLARE
    result jsonb := jsonb_build_object('success', true, 'inserted', jsonb_build_array(), 'updated', jsonb_build_array(), 'errors', jsonb_build_array());
    item jsonb;
    item_id uuid;
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
    v_is_insert boolean;
    v_estimate_exists boolean;
    v_product_exists boolean;
BEGIN
    -- Disable all triggers temporarily during sync
    PERFORM public.glsync_master_control();
    
    -- Process each item in the data array
    FOR item IN SELECT * FROM jsonb_array_elements(data)
    LOOP
        BEGIN
            -- Extract fields from the item
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
            
            -- Skip if no glide_row_id
            IF v_glide_row_id IS NULL THEN
                result := jsonb_set(result, '{errors}', result->'errors' || jsonb_build_object(
                    'message', 'Missing glide_row_id',
                    'item', item
                ));
                CONTINUE;
            END IF;
            
            -- Verify estimate exists (create placeholder if needed)
            IF v_rowid_estimates IS NOT NULL THEN
                SELECT EXISTS(
                    SELECT 1 FROM public.gl_estimates WHERE glide_row_id = v_rowid_estimates
                ) INTO v_estimate_exists;
                
                IF NOT v_estimate_exists THEN
                    -- Create a placeholder estimate if it doesn't exist
                    INSERT INTO public.gl_estimates (glide_row_id, created_at, updated_at)
                    VALUES (v_rowid_estimates, now(), now())
                    ON CONFLICT (glide_row_id) DO NOTHING;
                END IF;
            END IF;
            
            -- Verify product exists (create placeholder if needed)
            IF v_rowid_products IS NOT NULL THEN
                SELECT EXISTS(
                    SELECT 1 FROM public.gl_products WHERE glide_row_id = v_rowid_products
                ) INTO v_product_exists;
                
                IF NOT v_product_exists THEN
                    -- Create a placeholder product if it doesn't exist
                    INSERT INTO public.gl_products (glide_row_id, created_at, updated_at)
                    VALUES (v_rowid_products, now(), now())
                    ON CONFLICT (glide_row_id) DO NOTHING;
                END IF;
            END IF;
            
            -- Check if estimate line record exists
            SELECT id INTO item_id FROM public.gl_estimate_lines WHERE glide_row_id = v_glide_row_id;
            v_is_insert := item_id IS NULL;
            
            -- Insert or update based on existence
            IF v_is_insert THEN
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
                    COALESCE(v_sale_product_name, 'Product ' || v_rowid_products)
                )
                RETURNING id INTO item_id;
                
                -- Record as inserted
                result := jsonb_set(result, '{inserted}', result->'inserted' || to_jsonb(item_id));
            ELSE
                -- Update existing record
                UPDATE public.gl_estimate_lines
                SET
                    rowid_estimates = v_rowid_estimates,
                    rowid_products = v_rowid_products,
                    sale_product_name = v_sale_product_name,
                    qty_sold = v_qty_sold,
                    selling_price = v_selling_price,
                    product_sale_note = v_product_sale_note,
                    date_of_sale = v_date_of_sale,
                    updated_at = now(),
                    display_name = COALESCE(v_sale_product_name, 'Product ' || v_rowid_products)
                WHERE glide_row_id = v_glide_row_id;
                
                -- Record as updated
                result := jsonb_set(result, '{updated}', result->'updated' || to_jsonb(item_id));
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Record the error
            result := jsonb_set(result, '{errors}', result->'errors' || jsonb_build_object(
                'message', SQLERRM,
                'item', item
            ));
            result := jsonb_set(result, '{success}', 'false');
        END;
    END LOOP;
    
    -- Re-enable all triggers after sync
    PERFORM public.glsync_master_cleanup();
    
    -- Manually update totals for all affected estimates
    IF jsonb_array_length(result->'inserted') > 0 OR jsonb_array_length(result->'updated') > 0 THEN
        -- Get all unique estimate IDs from the processed items
        WITH estimate_ids AS (
            SELECT DISTINCT (item->>'rowid_estimates') AS estimate_id
            FROM jsonb_array_elements(data) AS item
            WHERE item->>'rowid_estimates' IS NOT NULL
        )
        -- Update the totals for each estimate
        UPDATE public.gl_estimates e
        SET 
            total_amount = COALESCE(subquery.total, 0),
            updated_at = now()
        FROM (
            SELECT 
                el.rowid_estimates,
                SUM(el.line_total) AS total
            FROM 
                public.gl_estimate_lines el
            JOIN 
                estimate_ids ON el.rowid_estimates = estimate_ids.estimate_id
            GROUP BY 
                el.rowid_estimates
        ) AS subquery
        WHERE e.glide_row_id = subquery.rowid_estimates;
    END IF;
    
    -- Update display names for all affected estimate lines
    WITH updated_lines AS (
        SELECT 
            el.id,
            COALESCE(el.sale_product_name, 
                    (SELECT COALESCE(p.new_product_name, p.vendor_product_name, 'Product ' || el.rowid_products)
                     FROM public.gl_products p
                     WHERE p.glide_row_id = el.rowid_products),
                    'Unnamed Product') AS new_display_name
        FROM 
            public.gl_estimate_lines el
        WHERE 
            el.id IN (
                SELECT (jsonb_array_elements(result->'inserted'))::uuid
                UNION
                SELECT (jsonb_array_elements(result->'updated'))::uuid
            )
    )
    UPDATE public.gl_estimate_lines el
    SET display_name = ul.new_display_name
    FROM updated_lines ul
    WHERE el.id = ul.id
    AND (el.display_name IS NULL OR el.display_name != ul.new_display_name);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- PART 4: Ensure the gl_estimate_lines table has the correct structure
DO $$
BEGIN
    -- Check if the table exists
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gl_estimate_lines'
    ) THEN
        -- Create the table if it doesn't exist
        CREATE TABLE public.gl_estimate_lines (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            glide_row_id text NOT NULL,
            rowid_estimates text,
            rowid_products text,
            sale_product_name text,
            qty_sold numeric,
            selling_price numeric,
            line_total numeric GENERATED ALWAYS AS (COALESCE(qty_sold, 0) * COALESCE(selling_price, 0)) STORED,
            product_sale_note text,
            date_of_sale timestamp with time zone,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            display_name text,
            CONSTRAINT gl_estimate_lines_pkey PRIMARY KEY (id),
            CONSTRAINT gl_estimate_lines_glide_row_id_key UNIQUE (glide_row_id)
        );
        
        -- Create indexes for better performance
        CREATE INDEX idx_gl_estimate_lines_rowid_estimates ON public.gl_estimate_lines(rowid_estimates);
        CREATE INDEX idx_gl_estimate_lines_rowid_products ON public.gl_estimate_lines(rowid_products);
        CREATE INDEX idx_gl_estimate_lines_created_at ON public.gl_estimate_lines(created_at);
    ELSE
        -- Ensure the table has the correct columns and constraints
        -- Check if line_total is a generated column
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'gl_estimate_lines' 
            AND column_name = 'line_total'
        ) THEN
            ALTER TABLE public.gl_estimate_lines 
            ADD COLUMN line_total numeric GENERATED ALWAYS AS (COALESCE(qty_sold, 0) * COALESCE(selling_price, 0)) STORED;
        END IF;
        
        -- Check if display_name column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'gl_estimate_lines' 
            AND column_name = 'display_name'
        ) THEN
            ALTER TABLE public.gl_estimate_lines 
            ADD COLUMN display_name text;
        END IF;
        
        -- Ensure the unique constraint exists
        IF NOT EXISTS (
            SELECT FROM pg_constraint 
            WHERE conname = 'gl_estimate_lines_glide_row_id_key'
        ) THEN
            ALTER TABLE public.gl_estimate_lines 
            ADD CONSTRAINT gl_estimate_lines_glide_row_id_key UNIQUE (glide_row_id);
        END IF;
        
        -- Ensure indexes exist
        IF NOT EXISTS (
            SELECT FROM pg_indexes 
            WHERE indexname = 'idx_gl_estimate_lines_rowid_estimates'
        ) THEN
            CREATE INDEX idx_gl_estimate_lines_rowid_estimates ON public.gl_estimate_lines(rowid_estimates);
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM pg_indexes 
            WHERE indexname = 'idx_gl_estimate_lines_rowid_products'
        ) THEN
            CREATE INDEX idx_gl_estimate_lines_rowid_products ON public.gl_estimate_lines(rowid_products);
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM pg_indexes 
            WHERE indexname = 'idx_gl_estimate_lines_created_at'
        ) THEN
            CREATE INDEX idx_gl_estimate_lines_created_at ON public.gl_estimate_lines(created_at);
        END IF;
    END IF;
END
$$;

-- PART 5: Create a view for estimate lines with product information
DROP VIEW IF EXISTS public.v_estimate_lines_with_products;
CREATE OR REPLACE VIEW public.v_estimate_lines_with_products AS
SELECT 
    el.*,
    p.vendor_product_name,
    p.new_product_name,
    COALESCE(p.new_product_name, p.vendor_product_name) as product_display_name,
    p.cost as product_cost
FROM 
    public.gl_estimate_lines el
LEFT JOIN 
    public.gl_products p ON el.rowid_products = p.glide_row_id;

-- PART 6: Grant necessary permissions
GRANT ALL ON TABLE public.gl_estimate_lines TO authenticated;
GRANT ALL ON TABLE public.gl_estimate_lines TO service_role;
GRANT EXECUTE ON FUNCTION public.glsync_estimate_lines(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.glsync_estimate_lines(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.glsync_master_control() TO authenticated;
GRANT EXECUTE ON FUNCTION public.glsync_master_control() TO service_role;
GRANT EXECUTE ON FUNCTION public.glsync_master_cleanup() TO authenticated;
GRANT EXECUTE ON FUNCTION public.glsync_master_cleanup() TO service_role;
GRANT SELECT ON public.v_estimate_lines_with_products TO authenticated;
GRANT SELECT ON public.v_estimate_lines_with_products TO service_role;
