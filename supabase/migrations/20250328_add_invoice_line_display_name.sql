-- First, add the display_name column to gl_invoice_lines if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gl_invoice_lines' 
        AND column_name = 'display_name'
    ) THEN
        ALTER TABLE public.gl_invoice_lines 
        ADD COLUMN display_name text;
    END IF;
END
$$;

-- Create a function to set the display_name based on the specified logic
CREATE OR REPLACE FUNCTION public.set_invoice_line_display_name()
RETURNS TRIGGER AS $$
DECLARE
    product_display_name text;
BEGIN
    -- If renamed_product_name is not null, use it
    IF NEW.renamed_product_name IS NOT NULL THEN
        NEW.display_name := NEW.renamed_product_name;
    -- Otherwise, try to get the name from the related product
    ELSIF NEW.rowid_products IS NOT NULL THEN
        -- Get the product name from gl_products
        SELECT 
            COALESCE(new_product_name, vendor_product_name) INTO product_display_name
        FROM 
            public.gl_products
        WHERE 
            glide_row_id = NEW.rowid_products;
            
        NEW.display_name := product_display_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically set the display_name on insert or update
DROP TRIGGER IF EXISTS set_invoice_line_display_name_trigger ON public.gl_invoice_lines;

CREATE TRIGGER set_invoice_line_display_name_trigger
BEFORE INSERT OR UPDATE ON public.gl_invoice_lines
FOR EACH ROW
EXECUTE FUNCTION public.set_invoice_line_display_name();

-- Update existing records to set the display_name
UPDATE public.gl_invoice_lines il
SET display_name = 
    CASE 
        WHEN il.renamed_product_name IS NOT NULL THEN 
            il.renamed_product_name
        ELSE (
            SELECT COALESCE(p.new_product_name, p.vendor_product_name)
            FROM public.gl_products p
            WHERE p.glide_row_id = il.rowid_products
        )
    END
WHERE il.display_name IS NULL;

-- Add an index on rowid_products to improve performance
CREATE INDEX IF NOT EXISTS idx_gl_invoice_lines_rowid_products
ON public.gl_invoice_lines(rowid_products);

COMMENT ON FUNCTION public.set_invoice_line_display_name() IS 'Sets the display_name for invoice lines based on renamed_product_name or the related product name';
