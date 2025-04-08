-- Complete fix for Glidebase sync issues with estimate lines
-- Run this in your Supabase SQL Editor

-- 1. Drop any materialized view that might be causing issues
DROP MATERIALIZED VIEW IF EXISTS public.mv_estimate_customer_details;

-- 2. Make sure the gl_estimate_lines table has the correct structure
-- First, check if the line_total column is properly set as a generated column
DO $$
BEGIN
    -- Check if line_total is a generated column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gl_estimate_lines' 
        AND column_name = 'line_total'
        AND is_generated = 'ALWAYS'
    ) THEN
        -- Drop the column if it exists but is not generated
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'gl_estimate_lines' 
            AND column_name = 'line_total'
        ) THEN
            ALTER TABLE public.gl_estimate_lines DROP COLUMN line_total;
        END IF;
        
        -- Add the column as a generated column
        ALTER TABLE public.gl_estimate_lines 
        ADD COLUMN line_total numeric GENERATED ALWAYS AS (COALESCE(qty_sold, 0) * COALESCE(selling_price, 0)) STORED;
        
        RAISE NOTICE 'Fixed line_total as a generated column';
    END IF;
END
$$;

-- 3. Create or replace the display_name function and trigger
CREATE OR REPLACE FUNCTION public.set_estimate_line_display_name()
RETURNS TRIGGER AS $$
BEGIN
    -- If sale_product_name is not null, use it
    IF NEW.sale_product_name IS NOT NULL THEN
        NEW.display_name := NEW.sale_product_name;
    -- Otherwise, try to get the name from the related product
    ELSIF NEW.rowid_products IS NOT NULL THEN
        BEGIN
            SELECT 
                COALESCE(new_product_name, vendor_product_name) INTO NEW.display_name
            FROM 
                public.gl_products
            WHERE 
                glide_row_id = NEW.rowid_products;
            
            -- If no product found or error occurs, use a fallback
            IF NEW.display_name IS NULL THEN
                NEW.display_name := 'Product ' || NEW.rowid_products;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Handle any errors
                NEW.display_name := 'Product ' || NEW.rowid_products;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it's using the latest function
DROP TRIGGER IF EXISTS set_estimate_line_display_name_trigger ON public.gl_estimate_lines;
CREATE TRIGGER set_estimate_line_display_name_trigger
BEFORE INSERT OR UPDATE ON public.gl_estimate_lines
FOR EACH ROW
EXECUTE FUNCTION public.set_estimate_line_display_name();

-- 4. Create or replace the update_estimate_totals function and trigger
CREATE OR REPLACE FUNCTION public.update_estimate_totals()
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

-- Drop and recreate the trigger to ensure it's using the latest function
DROP TRIGGER IF EXISTS update_estimate_totals_trigger ON public.gl_estimate_lines;
CREATE TRIGGER update_estimate_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.gl_estimate_lines
FOR EACH ROW
EXECUTE FUNCTION public.update_estimate_totals();

-- 5. Create a glsync function specifically for estimate_lines with proper ON CONFLICT handling
CREATE OR REPLACE FUNCTION public.glsync_estimate_lines(data jsonb)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    item jsonb;
    glide_row_id text;
    inserted_count integer := 0;
    updated_count integer := 0;
    error_count integer := 0;
    errors jsonb := '[]'::jsonb;
BEGIN
    result := '{"success": true, "inserted": [], "updated": [], "errors": []}'::jsonb;
    
    -- Process each item in the data array
    FOR item IN SELECT * FROM jsonb_array_elements(data)
    LOOP
        glide_row_id := item->>'glide_row_id';
        
        -- Skip if no glide_row_id
        IF glide_row_id IS NULL THEN
            errors := errors || jsonb_build_object(
                'message', 'Missing glide_row_id', 
                'item', item
            );
            error_count := error_count + 1;
            CONTINUE;
        END IF;
        
        -- Try to insert or update
        BEGIN
            -- Use ON CONFLICT to handle the case where the record already exists
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
                updated_at
            ) VALUES (
                glide_row_id,
                item->>'rowid_estimates',
                item->>'rowid_products',
                item->>'sale_product_name',
                (item->>'qty_sold')::numeric,
                (item->>'selling_price')::numeric,
                item->>'product_sale_note',
                (item->>'date_of_sale')::timestamp with time zone,
                COALESCE((item->>'created_at')::timestamp with time zone, now()),
                COALESCE((item->>'updated_at')::timestamp with time zone, now())
            )
            ON CONFLICT (glide_row_id) DO UPDATE SET
                rowid_estimates = EXCLUDED.rowid_estimates,
                rowid_products = EXCLUDED.rowid_products,
                sale_product_name = EXCLUDED.sale_product_name,
                qty_sold = EXCLUDED.qty_sold,
                selling_price = EXCLUDED.selling_price,
                product_sale_note = EXCLUDED.product_sale_note,
                date_of_sale = EXCLUDED.date_of_sale,
                updated_at = now();
            
            -- Record as inserted or updated
            IF found THEN
                inserted_count := inserted_count + 1;
            ELSE
                updated_count := updated_count + 1;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Record the error
            errors := errors || jsonb_build_object(
                'message', SQLERRM, 
                'item', item
            );
            error_count := error_count + 1;
        END;
    END LOOP;
    
    -- Build the final result
    result := jsonb_build_object(
        'success', (error_count = 0),
        'inserted_count', inserted_count,
        'updated_count', updated_count,
        'error_count', error_count,
        'errors', errors
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. Create regular views for estimate data (instead of materialized views)
DROP VIEW IF EXISTS public.v_estimate_customer_details;
CREATE OR REPLACE VIEW public.v_estimate_customer_details AS
SELECT 
    e.*,
    a.account_name,
    a.client_type,
    a.accounts_uid,
    a.photo as account_photo
FROM 
    public.gl_estimates e
LEFT JOIN 
    public.gl_accounts a ON e.rowid_accounts = a.glide_row_id;

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

-- 7. Grant necessary permissions
GRANT ALL ON TABLE public.gl_estimate_lines TO authenticated;
GRANT ALL ON TABLE public.gl_estimate_lines TO service_role;
GRANT SELECT ON public.v_estimate_customer_details TO authenticated;
GRANT SELECT ON public.v_estimate_customer_details TO service_role;
GRANT SELECT ON public.v_estimate_lines_with_products TO authenticated;
GRANT SELECT ON public.v_estimate_lines_with_products TO service_role;

-- 8. Update any existing estimate lines to ensure display_name is set
UPDATE public.gl_estimate_lines el
SET display_name = 
    CASE 
        WHEN el.sale_product_name IS NOT NULL THEN 
            el.sale_product_name
        ELSE (
            SELECT COALESCE(p.new_product_name, p.vendor_product_name)
            FROM public.gl_products p
            WHERE p.glide_row_id = el.rowid_products
        )
    END
WHERE el.display_name IS NULL;
