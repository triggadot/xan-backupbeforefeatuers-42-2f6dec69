-- Final fix for Glidebase sync issues with estimate lines
-- This script addresses the "no unique or exclusion constraint matching the ON CONFLICT specification" error

-- 1. Drop any materialized view that might be causing issues
DROP MATERIALIZED VIEW IF EXISTS public.mv_estimate_customer_details;

-- 2. Create or replace the glsync_estimate_lines function with proper ON CONFLICT handling
-- This is the most important fix that addresses the specific error you're encountering
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
            -- The key fix is explicitly specifying (glide_row_id) in the ON CONFLICT clause
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

-- 3. Create or replace the display_name function to ensure it works correctly
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

-- 4. Ensure the trigger exists for setting display names
DROP TRIGGER IF EXISTS set_estimate_line_display_name_trigger ON public.gl_estimate_lines;
CREATE TRIGGER set_estimate_line_display_name_trigger
BEFORE INSERT OR UPDATE ON public.gl_estimate_lines
FOR EACH ROW
EXECUTE FUNCTION public.set_estimate_line_display_name();

-- 5. Create regular views instead of materialized views
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

-- 6. Grant necessary permissions
GRANT ALL ON TABLE public.gl_estimate_lines TO authenticated;
GRANT ALL ON TABLE public.gl_estimate_lines TO service_role;
GRANT SELECT ON public.v_estimate_customer_details TO authenticated;
GRANT SELECT ON public.v_estimate_customer_details TO service_role;
GRANT SELECT ON public.v_estimate_lines_with_products TO authenticated;
GRANT SELECT ON public.v_estimate_lines_with_products TO service_role;
