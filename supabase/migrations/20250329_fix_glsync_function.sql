-- This script fixes the glsync function for estimate lines
-- It specifically addresses the "no unique or exclusion constraint matching the ON CONFLICT specification" error

-- First, let's check if there's a glsync function for estimate lines and drop it if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'glsync_estimate_lines'
    ) THEN
        DROP FUNCTION IF EXISTS public.glsync_estimate_lines(jsonb);
    END IF;
END
$$;

-- Now create a new glsync function with the correct ON CONFLICT handling
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
BEGIN
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
            
            -- Check if record exists
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
                    updated_at
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
                    v_updated_at
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
                    updated_at = now()
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
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.glsync_estimate_lines(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.glsync_estimate_lines(jsonb) TO service_role;

-- Also ensure the line_total is properly calculated
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
        -- Create a trigger to calculate line_total if it's not a generated column
        CREATE OR REPLACE FUNCTION public.calculate_estimate_line_total()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.line_total := COALESCE(NEW.qty_sold, 0) * COALESCE(NEW.selling_price, 0);
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create the trigger if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM pg_trigger 
            WHERE tgname = 'calculate_estimate_line_total_trigger'
        ) THEN
            CREATE TRIGGER calculate_estimate_line_total_trigger
            BEFORE INSERT OR UPDATE ON public.gl_estimate_lines
            FOR EACH ROW
            EXECUTE FUNCTION public.calculate_estimate_line_total();
        END IF;
        
        RAISE NOTICE 'Created trigger to calculate line_total';
    END IF;
END
$$;
