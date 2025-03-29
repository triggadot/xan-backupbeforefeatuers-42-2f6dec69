-- Drop existing triggers first to avoid dependency issues
DROP TRIGGER IF EXISTS set_estimate_line_display_name_trigger ON public.gl_estimate_lines;
DROP TRIGGER IF EXISTS update_estimate_totals_trigger ON public.gl_estimate_lines;

-- Drop existing functions that might depend on the table structure
DROP FUNCTION IF EXISTS public.set_estimate_line_display_name();
DROP FUNCTION IF EXISTS public.update_estimate_totals();

-- Drop the table if it exists
DROP TABLE IF EXISTS public.gl_estimate_lines;

-- Recreate the table with the correct structure
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

-- Create function to set the display_name based on the specified logic
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

-- Create trigger to automatically set the display_name on insert or update
CREATE TRIGGER set_estimate_line_display_name_trigger
BEFORE INSERT OR UPDATE ON public.gl_estimate_lines
FOR EACH ROW
EXECUTE FUNCTION public.set_estimate_line_display_name();

-- Create function to update estimate totals when lines change
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

-- Create trigger to update estimate totals when lines change
CREATE TRIGGER update_estimate_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.gl_estimate_lines
FOR EACH ROW
EXECUTE FUNCTION public.update_estimate_totals();

-- Add comments for documentation
COMMENT ON TABLE public.gl_estimate_lines IS 'Stores line items for estimates';
COMMENT ON COLUMN public.gl_estimate_lines.rowid_estimates IS 'References gl_estimates.glide_row_id';
COMMENT ON COLUMN public.gl_estimate_lines.rowid_products IS 'References gl_products.glide_row_id';
COMMENT ON FUNCTION public.set_estimate_line_display_name() IS 'Sets the display_name for estimate lines based on sale_product_name or the related product name';
COMMENT ON FUNCTION public.update_estimate_totals() IS 'Updates the total_amount in gl_estimates when estimate lines change';
