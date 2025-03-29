-- This script fixes issues with Glidebase sync by modifying constraints and adding ON CONFLICT handlers

-- First, check if the gl_estimate_lines table exists
DO $$
BEGIN
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
        
        -- Create necessary indexes
        CREATE INDEX idx_gl_estimate_lines_rowid_estimates ON public.gl_estimate_lines(rowid_estimates);
        CREATE INDEX idx_gl_estimate_lines_rowid_products ON public.gl_estimate_lines(rowid_products);
        CREATE INDEX idx_gl_estimate_lines_created_at ON public.gl_estimate_lines(created_at);
        
        RAISE NOTICE 'Created gl_estimate_lines table with proper constraints';
    ELSE
        -- Table exists, ensure the glide_row_id constraint is properly set
        IF NOT EXISTS (
            SELECT FROM pg_constraint 
            WHERE conname = 'gl_estimate_lines_glide_row_id_key'
        ) THEN
            -- Add the constraint if it doesn't exist
            ALTER TABLE public.gl_estimate_lines 
            ADD CONSTRAINT gl_estimate_lines_glide_row_id_key UNIQUE (glide_row_id);
            
            RAISE NOTICE 'Added missing unique constraint on glide_row_id';
        END IF;
    END IF;
END
$$;

-- Check if the display_name function exists and create it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'set_estimate_line_display_name'
    ) THEN
        -- Create the function
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
        
        RAISE NOTICE 'Created set_estimate_line_display_name function';
    END IF;
END
$$;

-- Check if the update_estimate_totals function exists and create it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'update_estimate_totals'
    ) THEN
        -- Create the function
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
        
        RAISE NOTICE 'Created update_estimate_totals function';
    END IF;
END
$$;

-- Ensure triggers exist
DO $$
BEGIN
    -- Check and create the display_name trigger if needed
    IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'set_estimate_line_display_name_trigger'
    ) THEN
        CREATE TRIGGER set_estimate_line_display_name_trigger
        BEFORE INSERT OR UPDATE ON public.gl_estimate_lines
        FOR EACH ROW
        EXECUTE FUNCTION public.set_estimate_line_display_name();
        
        RAISE NOTICE 'Created set_estimate_line_display_name_trigger';
    END IF;
    
    -- Check and create the update_totals trigger if needed
    IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'update_estimate_totals_trigger'
    ) THEN
        CREATE TRIGGER update_estimate_totals_trigger
        AFTER INSERT OR UPDATE OR DELETE ON public.gl_estimate_lines
        FOR EACH ROW
        EXECUTE FUNCTION public.update_estimate_totals();
        
        RAISE NOTICE 'Created update_estimate_totals_trigger';
    END IF;
END
$$;

-- Create or replace the glsync function to handle the ON CONFLICT case properly
-- This is a simplified example - you'll need to adjust based on your actual glsync function
CREATE OR REPLACE FUNCTION public.glsync_estimate_lines(data jsonb)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    item jsonb;
    glide_row_id text;
BEGIN
    result := '{"success": true, "inserted": [], "updated": [], "errors": []}'::jsonb;
    
    -- Process each item in the data array
    FOR item IN SELECT * FROM jsonb_array_elements(data)
    LOOP
        glide_row_id := item->>'glide_row_id';
        
        -- Skip if no glide_row_id
        IF glide_row_id IS NULL THEN
            result := jsonb_set(result, '{errors}', result->'errors' || jsonb_build_array(
                jsonb_build_object('message', 'Missing glide_row_id', 'item', item)
            ));
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
                updated_at = now()
            RETURNING id INTO glide_row_id;
            
            -- Record as inserted or updated
            IF found THEN
                result := jsonb_set(result, '{inserted}', result->'inserted' || jsonb_build_array(glide_row_id));
            ELSE
                result := jsonb_set(result, '{updated}', result->'updated' || jsonb_build_array(glide_row_id));
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Record the error
            result := jsonb_set(result, '{errors}', result->'errors' || jsonb_build_array(
                jsonb_build_object('message', SQLERRM, 'item', item)
            ));
        END;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON TABLE public.gl_estimate_lines TO authenticated;
GRANT ALL ON TABLE public.gl_estimate_lines TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.gl_estimate_lines_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.gl_estimate_lines_id_seq TO service_role;
