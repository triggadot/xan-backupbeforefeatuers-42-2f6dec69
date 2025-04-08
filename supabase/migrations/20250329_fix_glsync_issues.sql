-- Fix for "must be owner of materialized view mv_estimate_customer_details"
-- First, drop the materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS public.mv_estimate_customer_details;

-- Check the actual column name in the estimate_lines table
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Check if rowid_estimates exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gl_estimate_lines' 
        AND column_name = 'rowid_estimates'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        -- Check if rowid_estimate_lines exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'gl_estimate_lines' 
            AND column_name = 'rowid_estimate_lines'
        ) INTO column_exists;
        
        IF column_exists THEN
            -- Rename the column to follow the correct naming convention
            ALTER TABLE public.gl_estimate_lines 
            RENAME COLUMN rowid_estimate_lines TO rowid_estimates;
            
            RAISE NOTICE 'Renamed column rowid_estimate_lines to rowid_estimates';
        ELSE
            RAISE EXCEPTION 'Neither rowid_estimates nor rowid_estimate_lines column exists in gl_estimate_lines table';
        END IF;
    END IF;
END
$$;

-- Now create the materialized view with the correct column name
CREATE MATERIALIZED VIEW public.mv_estimate_customer_details AS
SELECT 
    e.*,
    a.account_name,
    a.client_type,
    a.accounts_uid,
    a.photo as account_photo,
    jsonb_agg(
        jsonb_build_object(
            'id', el.id,
            'glide_row_id', el.glide_row_id,
            'sale_product_name', el.sale_product_name,
            'display_name', el.display_name,
            'qty_sold', el.qty_sold,
            'selling_price', el.selling_price,
            'line_total', el.line_total,
            'product_data', jsonb_build_object(
                'id', p.id,
                'glide_row_id', p.glide_row_id,
                'vendor_product_name', p.vendor_product_name,
                'new_product_name', p.new_product_name
            )
        )
    ) FILTER (WHERE el.id IS NOT NULL) AS estimate_lines
FROM 
    public.gl_estimates e
LEFT JOIN 
    public.gl_accounts a ON e.rowid_accounts = a.glide_row_id
LEFT JOIN 
    public.gl_estimate_lines el ON el.rowid_estimates = e.glide_row_id
LEFT JOIN 
    public.gl_products p ON el.rowid_products = p.glide_row_id
GROUP BY
    e.id, e.glide_row_id, a.account_name, a.client_type, a.accounts_uid, a.photo;

-- Add proper permissions for the Glidebase sync process
GRANT SELECT ON public.mv_estimate_customer_details TO authenticated;
GRANT SELECT ON public.mv_estimate_customer_details TO service_role;
GRANT SELECT ON public.mv_estimate_customer_details TO anon;

-- Fix for "record 'new' has no field 'rowid_estimate_lines'"
-- Find and fix any triggers that might be using the wrong field name
DO $$
DECLARE
    trigger_record record;
    trigger_function text;
    updated_function text;
BEGIN
    -- Loop through all triggers in the database
    FOR trigger_record IN 
        SELECT 
            t.tgname AS trigger_name,
            p.proname AS function_name,
            p.prosrc AS function_source
        FROM 
            pg_trigger t
        JOIN 
            pg_proc p ON t.tgfoid = p.oid
        JOIN 
            pg_class c ON t.tgrelid = c.oid
        JOIN 
            pg_namespace n ON c.relnamespace = n.oid
        WHERE 
            n.nspname = 'public' AND
            p.prosrc LIKE '%rowid_estimate_lines%'
    LOOP
        -- Get the function source
        trigger_function := trigger_record.function_source;
        
        -- Replace incorrect field name
        updated_function := REPLACE(trigger_function, 'rowid_estimate_lines', 'rowid_estimates');
        
        -- Update the function
        EXECUTE format('
            CREATE OR REPLACE FUNCTION public.%I() RETURNS trigger AS $func$
                %s
            $func$ LANGUAGE plpgsql;
        ', trigger_record.function_name, updated_function);
        
        RAISE NOTICE 'Updated function % to use correct field name', trigger_record.function_name;
    END LOOP;
END
$$;

-- Check for any glsync functions that might be using the wrong field name
DO $$
DECLARE
    function_record record;
    function_source text;
    updated_source text;
BEGIN
    -- Loop through all functions with 'glsync' prefix
    FOR function_record IN 
        SELECT 
            p.proname AS function_name,
            p.prosrc AS function_source
        FROM 
            pg_proc p
        JOIN 
            pg_namespace n ON p.pronamespace = n.oid
        WHERE 
            n.nspname = 'public' AND
            p.proname LIKE 'glsync%' AND
            p.prosrc LIKE '%rowid_estimate_lines%'
    LOOP
        -- Get the function source
        function_source := function_record.function_source;
        
        -- Replace incorrect field name
        updated_source := REPLACE(function_source, 'rowid_estimate_lines', 'rowid_estimates');
        
        -- Update the function
        EXECUTE format('
            CREATE OR REPLACE FUNCTION public.%I(%s) RETURNS %s AS $func$
                %s
            $func$ LANGUAGE %s;
        ', 
        function_record.function_name, 
        (SELECT pg_get_function_arguments(p.oid) FROM pg_proc p WHERE p.proname = function_record.function_name LIMIT 1),
        (SELECT pg_get_function_result(p.oid) FROM pg_proc p WHERE p.proname = function_record.function_name LIMIT 1),
        updated_source,
        (SELECT l.lanname FROM pg_language l JOIN pg_proc p ON p.prolang = l.oid WHERE p.proname = function_record.function_name LIMIT 1)
        );
        
        RAISE NOTICE 'Updated glsync function % to use correct field name', function_record.function_name;
    END LOOP;
END
$$;

-- Refresh the materialized view to ensure it's up to date
REFRESH MATERIALIZED VIEW public.mv_estimate_customer_details;
