-- Create or replace the function to set the display_name based on the specified logic
CREATE OR REPLACE FUNCTION public.set_estimate_line_display_name()
RETURNS TRIGGER AS $$
BEGIN
    -- If sale_product_name is not null, use it
    IF NEW.sale_product_name IS NOT NULL THEN
        NEW.display_name := NEW.sale_product_name;
    -- Otherwise, try to get the name from the related product if it exists
    ELSIF NEW.rowid_products IS NOT NULL THEN
        -- Check if the product exists
        DECLARE
            product_name text;
        BEGIN
            SELECT COALESCE(new_product_name, vendor_product_name) INTO product_name
            FROM public.gl_products
            WHERE glide_row_id = NEW.rowid_products;
            
            IF FOUND THEN
                NEW.display_name := product_name;
            ELSE
                -- Fallback if product not found
                NEW.display_name := 'Product ' || NEW.rowid_products;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Handle any database errors
                RAISE NOTICE 'Error getting product name: %', SQLERRM;
                NEW.display_name := 'Product ' || NEW.rowid_products;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Also update existing records to set display_name
DO $$
BEGIN
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
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating display_name: %', SQLERRM;
END
$$;

-- Make sure the trigger is correctly set up
DROP TRIGGER IF EXISTS set_estimate_line_display_name_trigger ON public.gl_estimate_lines;

CREATE TRIGGER set_estimate_line_display_name_trigger
BEFORE INSERT OR UPDATE ON public.gl_estimate_lines
FOR EACH ROW
EXECUTE FUNCTION public.set_estimate_line_display_name();
