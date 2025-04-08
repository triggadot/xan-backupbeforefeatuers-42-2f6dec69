-- Complete rebuild of the gl_estimate_lines table with proper relationships and triggers
-- This follows the Glidebase pattern where relationships use rowid_ fields to reference glide_row_id values

-- First, drop any views or materialized views that depend on gl_estimate_lines
DROP VIEW IF EXISTS public.v_estimate_lines_with_products;
DROP MATERIALIZED VIEW IF EXISTS public.mv_estimate_customer_details;

-- Drop any triggers on gl_estimate_lines
DROP TRIGGER IF EXISTS set_estimate_line_display_name_trigger ON public.gl_estimate_lines;
DROP TRIGGER IF EXISTS update_estimate_totals_trigger ON public.gl_estimate_lines;
DROP TRIGGER IF EXISTS calculate_estimate_line_total_trigger ON public.gl_estimate_lines;

-- Drop any functions related to gl_estimate_lines
DROP FUNCTION IF EXISTS public.set_estimate_line_display_name();
DROP FUNCTION IF EXISTS public.update_estimate_totals();
DROP FUNCTION IF EXISTS public.calculate_estimate_line_total();

-- Now drop and recreate the gl_estimate_lines table
DROP TABLE IF EXISTS public.gl_estimate_lines;

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

-- Create a function to update estimate totals when lines change
-- This should be created BEFORE the display_name function to ensure proper dependencies
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

-- Create a trigger for the update_estimate_totals function
CREATE TRIGGER update_estimate_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.gl_estimate_lines
FOR EACH ROW
EXECUTE FUNCTION public.update_estimate_totals();

-- Now create the display_name function with proper error handling
-- This function will be called AFTER relationships are established
CREATE OR REPLACE FUNCTION public.set_estimate_line_display_name()
RETURNS TRIGGER AS $$
BEGIN
    -- If sale_product_name is not null, use it as the primary display name
    IF NEW.sale_product_name IS NOT NULL AND NEW.sale_product_name != '' THEN
        NEW.display_name := NEW.sale_product_name;
        RETURN NEW;
    END IF;
    
    -- If we don't have a product relationship yet, use a placeholder
    IF NEW.rowid_products IS NULL OR NEW.rowid_products = '' THEN
        NEW.display_name := 'Unnamed Product';
        RETURN NEW;
    END IF;
    
    -- Try to get the product name from the related product
    BEGIN
        SELECT 
            COALESCE(new_product_name, vendor_product_name, 'Product ' || NEW.rowid_products) 
        INTO NEW.display_name
        FROM 
            public.gl_products
        WHERE 
            glide_row_id = NEW.rowid_products;
        
        -- If no product found, use a fallback
        IF NEW.display_name IS NULL THEN
            NEW.display_name := 'Product ' || NEW.rowid_products;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Handle any errors by using a safe fallback
            NEW.display_name := 'Product ' || NEW.rowid_products;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for the display_name function
CREATE TRIGGER set_estimate_line_display_name_trigger
BEFORE INSERT OR UPDATE ON public.gl_estimate_lines
FOR EACH ROW
EXECUTE FUNCTION public.set_estimate_line_display_name();

-- Create a custom glsync function for estimate lines that avoids ON CONFLICT issues
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

-- Create a view for estimate lines with product information
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

-- Grant necessary permissions
GRANT ALL ON TABLE public.gl_estimate_lines TO authenticated;
GRANT ALL ON TABLE public.gl_estimate_lines TO service_role;
GRANT EXECUTE ON FUNCTION public.glsync_estimate_lines(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.glsync_estimate_lines(jsonb) TO service_role;
GRANT SELECT ON public.v_estimate_lines_with_products TO authenticated;
GRANT SELECT ON public.v_estimate_lines_with_products TO service_role;
