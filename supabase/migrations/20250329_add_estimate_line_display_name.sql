-- First, check if the gl_estimate_lines table exists and create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gl_estimate_lines'
    ) THEN
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
            CONSTRAINT gl_estimate_lines_pkey PRIMARY KEY (id),
            CONSTRAINT gl_estimate_lines_glide_row_id_key UNIQUE (glide_row_id)
        );
        
        RAISE NOTICE 'Created gl_estimate_lines table';
    END IF;
    
    -- Now add the display_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gl_estimate_lines' 
        AND column_name = 'display_name'
    ) THEN
        ALTER TABLE public.gl_estimate_lines 
        ADD COLUMN display_name text;
        
        RAISE NOTICE 'Added display_name column to gl_estimate_lines';
    END IF;
END
$$;

-- Create a function to set the display_name based on the specified logic
CREATE OR REPLACE FUNCTION public.set_estimate_line_display_name()
RETURNS TRIGGER AS $$
BEGIN
    -- If sale_product_name is not null, use it
    IF NEW.sale_product_name IS NOT NULL THEN
        NEW.display_name := NEW.sale_product_name;
    -- Otherwise, try to get the name from the related product if the table exists
    ELSIF NEW.rowid_products IS NOT NULL THEN
        -- Check if gl_products table exists
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'gl_products'
        ) THEN
            -- Get the product name from gl_products
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
                    -- Handle any errors (like missing columns)
                    NEW.display_name := 'Product ' || NEW.rowid_products;
            END;
        ELSE
            -- If gl_products table doesn't exist, use a fallback
            NEW.display_name := 'Product ' || NEW.rowid_products;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically set the display_name on insert or update
DROP TRIGGER IF EXISTS set_estimate_line_display_name_trigger ON public.gl_estimate_lines;

CREATE TRIGGER set_estimate_line_display_name_trigger
BEFORE INSERT OR UPDATE ON public.gl_estimate_lines
FOR EACH ROW
EXECUTE FUNCTION public.set_estimate_line_display_name();

-- Update existing records to set the display_name
DO $$
BEGIN
    -- Only attempt the update if the gl_products table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gl_products'
    ) THEN
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
                RAISE NOTICE 'Error updating existing records: %', SQLERRM;
        END;
    ELSE
        -- If gl_products doesn't exist, use a simpler update
        UPDATE public.gl_estimate_lines el
        SET display_name = 
            CASE 
                WHEN el.sale_product_name IS NOT NULL THEN 
                    el.sale_product_name
                ELSE 
                    'Product ' || el.rowid_products
            END
        WHERE el.display_name IS NULL;
    END IF;
END
$$;

-- Add an index on rowid_products to improve performance
CREATE INDEX IF NOT EXISTS idx_gl_estimate_lines_rowid_products
ON public.gl_estimate_lines(rowid_products);

-- Add an index on rowid_estimates to improve performance
CREATE INDEX IF NOT EXISTS idx_gl_estimate_lines_rowid_estimates
ON public.gl_estimate_lines(rowid_estimates);

COMMENT ON FUNCTION public.set_estimate_line_display_name() IS 'Sets the display_name for estimate lines based on sale_product_name or the related product name';
