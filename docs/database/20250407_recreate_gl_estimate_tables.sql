-- Migration: 20250407_recreate_gl_estimate_tables.sql
-- Purpose: Recreate gl_estimates and gl_estimate_lines tables with proper structure and triggers
-- Date: 2025-04-07
-- Author: AI Assistant

-- This migration recreates the gl_estimates and gl_estimate_lines tables
-- to ensure they follow the standard Glidebase pattern where relationships
-- use rowid_ fields referencing glide_row_id values without foreign key constraints.

-- Step 1: Disable triggers temporarily to avoid cascading issues
SET session_replication_role = 'replica';

-- Step 2: Drop existing tables with cascade to remove dependencies
DROP TABLE IF EXISTS gl_estimate_lines CASCADE;
DROP TABLE IF EXISTS gl_estimates CASCADE;

-- Step 3: Drop any special sync functions
DROP FUNCTION IF EXISTS glsync_estimate_lines_complete(jsonb);

-- Step 4: Recreate gl_estimates table
CREATE TABLE public.gl_estimates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    glide_row_id text NOT NULL,
    rowid_invoices text,
    rowid_accounts text,
    estimate_date timestamp with time zone,
    is_a_sample boolean DEFAULT false,
    date_invoice_created_date timestamp with time zone,
    add_note boolean DEFAULT false,
    valid_final_create_invoice_clicked boolean DEFAULT false,
    glide_pdf_url text,
    glide_pdf_url2 text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    total_amount numeric DEFAULT 0,
    total_credits numeric DEFAULT 0,
    balance numeric DEFAULT 0,
    estimate_uid text,
    status text DEFAULT 'draft'::text,
    supabase_pdf_url text,
    CONSTRAINT gl_estimates_pkey PRIMARY KEY (id),
    CONSTRAINT gl_estimates_glide_row_id_key UNIQUE (glide_row_id)
);

COMMENT ON TABLE public.gl_estimates IS 'Estimates table. Uses standard Glidebase pattern for syncing with no special handling required.';

-- Step 5: Recreate gl_estimate_lines table
CREATE TABLE public.gl_estimate_lines (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    glide_row_id text NOT NULL,
    rowid_estimates text,
    rowid_products text,
    date_of_sale timestamp with time zone,
    sale_product_name text,
    selling_price numeric,
    total_stock_after_sell numeric,
    qty_sold numeric,
    product_sale_note text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    line_total numeric GENERATED ALWAYS AS (COALESCE(qty_sold, 0) * COALESCE(selling_price, 0)) STORED,
    product_name_display text,
    CONSTRAINT gl_estimate_lines_pkey PRIMARY KEY (id),
    CONSTRAINT gl_estimate_lines_glide_row_id_key UNIQUE (glide_row_id)
);

COMMENT ON TABLE public.gl_estimate_lines IS 'Estimate line items. Uses standard Glidebase pattern where relationships use rowid_ fields referencing glide_row_id values without foreign key constraints.';

-- Step 6: Create necessary indexes for gl_estimates
CREATE INDEX IF NOT EXISTS idx_gl_estimates_rowid_accounts ON public.gl_estimates(rowid_accounts);
CREATE INDEX IF NOT EXISTS idx_gl_estimates_rowid_invoices ON public.gl_estimates(rowid_invoices);
CREATE INDEX IF NOT EXISTS idx_gl_estimates_estimate_date ON public.gl_estimates(estimate_date);
CREATE INDEX IF NOT EXISTS idx_gl_estimates_created_at ON public.gl_estimates(created_at);

-- Step 7: Create necessary indexes for gl_estimate_lines
CREATE INDEX IF NOT EXISTS idx_gl_estimate_lines_rowid_estimates ON public.gl_estimate_lines(rowid_estimates);
CREATE INDEX IF NOT EXISTS idx_gl_estimate_lines_rowid_products ON public.gl_estimate_lines(rowid_products);
CREATE INDEX IF NOT EXISTS idx_gl_estimate_lines_date_of_sale ON public.gl_estimate_lines(date_of_sale);

-- Step 8: Create function to generate estimate UID
CREATE OR REPLACE FUNCTION public.generate_estimate_uid()
RETURNS TRIGGER AS $$
DECLARE
    account_uid text;
    date_part text;
BEGIN
    -- Get account_uid from gl_accounts
    SELECT accounts_uid INTO account_uid
    FROM gl_accounts
    WHERE glide_row_id = NEW.rowid_accounts;
    
    -- Format date part (mmddyy)
    IF NEW.estimate_date IS NOT NULL THEN
        date_part := to_char(NEW.estimate_date, 'MMDDYY');
    ELSE
        date_part := to_char(CURRENT_DATE, 'MMDDYY');
    END IF;
    
    -- Generate estimate_uid
    IF account_uid IS NOT NULL THEN
        NEW.estimate_uid := 'EST#' || account_uid || date_part;
    ELSE
        NEW.estimate_uid := 'EST#UNKNOWN' || date_part;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_estimate_uid() IS 'Generates a unique identifier for estimates in the format EST#[account_uid][mmddyy]';

-- Step 9: Create trigger for estimate UID generation
DROP TRIGGER IF EXISTS generate_estimate_uid_trigger ON public.gl_estimates;

-- Trigger for INSERT operations
CREATE TRIGGER generate_estimate_uid_insert_trigger
BEFORE INSERT
ON public.gl_estimates
FOR EACH ROW
WHEN (NEW.estimate_uid IS NULL)
EXECUTE FUNCTION public.generate_estimate_uid();

-- Trigger for UPDATE operations
CREATE TRIGGER generate_estimate_uid_update_trigger
BEFORE UPDATE OF rowid_accounts, estimate_date
ON public.gl_estimates
FOR EACH ROW
WHEN (NEW.estimate_uid IS NULL OR 
      OLD.rowid_accounts IS DISTINCT FROM NEW.rowid_accounts OR 
      OLD.estimate_date IS DISTINCT FROM NEW.estimate_date)
EXECUTE FUNCTION public.generate_estimate_uid();

-- Step 10: Create function to set estimate line display name
CREATE OR REPLACE FUNCTION public.set_estimate_line_display_name()
RETURNS TRIGGER AS $$
DECLARE
    product_display_name text;
BEGIN
    -- If sale_product_name is provided, use it (takes highest priority)
    IF NEW.sale_product_name IS NOT NULL AND NEW.sale_product_name != '' THEN
        NEW.product_name_display := NEW.sale_product_name;
    -- Otherwise, try to get display_name from gl_products
    ELSIF NEW.rowid_products IS NOT NULL THEN
        SELECT display_name INTO product_display_name
        FROM gl_products
        WHERE glide_row_id = NEW.rowid_products;
        
        IF product_display_name IS NOT NULL THEN
            NEW.product_name_display := product_display_name;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.set_estimate_line_display_name() IS 'Sets the product_name_display field based on sale_product_name (if provided) or falls back to gl_products.display_name';

-- Step 11: Create trigger for setting estimate line display name
DROP TRIGGER IF EXISTS set_estimate_line_display_name_trigger ON public.gl_estimate_lines;
CREATE TRIGGER set_estimate_line_display_name_trigger
BEFORE INSERT OR UPDATE OF sale_product_name, rowid_products
ON public.gl_estimate_lines
FOR EACH ROW
EXECUTE FUNCTION public.set_estimate_line_display_name();

-- Step 12: Create function to update estimate totals
-- First version with parameter for specific estimate updates
CREATE OR REPLACE FUNCTION public.update_estimate_totals(estimate_id text)
RETURNS VOID AS $$
BEGIN
    -- Calculate total amount from line items
    UPDATE gl_estimates e
    SET 
        total_amount = COALESCE((
            SELECT SUM(line_total)
            FROM gl_estimate_lines
            WHERE rowid_estimates = e.glide_row_id
        ), 0),
        balance = COALESCE((
            SELECT SUM(line_total)
            FROM gl_estimate_lines
            WHERE rowid_estimates = e.glide_row_id
        ), 0) - COALESCE(total_credits, 0),
        updated_at = NOW()
    WHERE e.glide_row_id = estimate_id;
END;
$$ LANGUAGE plpgsql;

-- Second version with no parameters for trigger usage
CREATE OR REPLACE FUNCTION public.update_estimate_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT and UPDATE operations
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update the estimate totals for the affected estimate
        PERFORM update_estimate_totals(NEW.rowid_estimates);
    -- For DELETE operations
    ELSIF TG_OP = 'DELETE' THEN
        -- Update the estimate totals for the affected estimate
        PERFORM update_estimate_totals(OLD.rowid_estimates);
    END IF;
    
    RETURN NULL; -- For AFTER triggers, return value is ignored
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_estimate_totals(text) IS 'Updates the total_amount and balance fields for a specific estimate based on its line items';
COMMENT ON FUNCTION public.update_estimate_totals() IS 'Trigger function that updates the total_amount and balance fields for estimates when line items change';

-- Step 13: Create trigger for updating estimate totals
DROP TRIGGER IF EXISTS update_estimate_totals_trigger ON public.gl_estimate_lines;
CREATE TRIGGER update_estimate_totals_trigger
AFTER INSERT OR UPDATE OR DELETE
ON public.gl_estimate_lines
FOR EACH ROW
EXECUTE FUNCTION public.update_estimate_totals();

-- Step 14: Create function to create invoice from estimate
CREATE OR REPLACE FUNCTION public.create_invoice_from_estimate()
RETURNS TRIGGER AS $$
DECLARE
    new_invoice_id text;
    account_id text;
BEGIN
    -- Only proceed if valid_final_create_invoice_clicked is true
    -- For UPDATE operations, only proceed if it changed from false/null to true
    IF NEW.valid_final_create_invoice_clicked = true AND 
       (TG_OP = 'INSERT' OR 
        (TG_OP = 'UPDATE' AND (OLD.valid_final_create_invoice_clicked = false OR OLD.valid_final_create_invoice_clicked IS NULL))) THEN
        
        -- Get account ID
        account_id := NEW.rowid_accounts;
        
        -- Create new invoice
        INSERT INTO gl_invoices (
            glide_row_id,
            rowid_accounts,
            invoice_order_date,
            notes
        ) VALUES (
            gen_random_uuid()::text,
            account_id,
            CURRENT_TIMESTAMP,
            NEW.notes
        )
        RETURNING glide_row_id INTO new_invoice_id;
        
        -- Update estimate with invoice reference
        UPDATE gl_estimates
        SET 
            rowid_invoices = new_invoice_id,
            date_invoice_created_date = CURRENT_TIMESTAMP,
            updated_at = NOW()
        WHERE id = NEW.id;
        
        -- Copy estimate lines to invoice lines
        INSERT INTO gl_invoice_lines (
            glide_row_id,
            rowid_invoices,
            rowid_products,
            renamed_product_name,
            qty_sold,
            selling_price,
            product_sale_note,
            date_of_sale
        )
        SELECT
            gen_random_uuid()::text,
            new_invoice_id,
            rowid_products,
            sale_product_name,
            qty_sold,
            selling_price,
            product_sale_note,
            date_of_sale
        FROM
            gl_estimate_lines
        WHERE
            rowid_estimates = NEW.glide_row_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.create_invoice_from_estimate() IS 'Creates a new invoice from an estimate when valid_final_create_invoice_clicked is set to true';

-- Step 15: Create triggers for creating invoice from estimate
DROP TRIGGER IF EXISTS create_invoice_from_estimate_trigger ON public.gl_estimates;

-- Trigger for INSERT operations
CREATE TRIGGER create_invoice_from_estimate_insert_trigger
AFTER INSERT
ON public.gl_estimates
FOR EACH ROW
WHEN (NEW.valid_final_create_invoice_clicked = true)
EXECUTE FUNCTION public.create_invoice_from_estimate();

-- Trigger for UPDATE operations
CREATE TRIGGER create_invoice_from_estimate_update_trigger
AFTER UPDATE OF valid_final_create_invoice_clicked
ON public.gl_estimates
FOR EACH ROW
WHEN (NEW.valid_final_create_invoice_clicked = true AND
      (OLD.valid_final_create_invoice_clicked = false OR OLD.valid_final_create_invoice_clicked IS NULL))
EXECUTE FUNCTION public.create_invoice_from_estimate();

-- Step 16: Create function to update account balance from estimates
CREATE OR REPLACE FUNCTION public.update_account_balance_from_related()
RETURNS TRIGGER AS $$
DECLARE
    account_id text;
BEGIN
    -- For estimates, update the account balance
    IF TG_TABLE_NAME = 'gl_estimates' THEN
        IF TG_OP = 'DELETE' THEN
            account_id := OLD.rowid_accounts;
        ELSE
            account_id := NEW.rowid_accounts;
        END IF;
        
        -- Only proceed if we have an account ID
        IF account_id IS NOT NULL THEN
            -- Update the account balance
            UPDATE gl_accounts
            SET balance = (
                -- Sum of all related estimate balances
                SELECT COALESCE(SUM(balance), 0)
                FROM gl_estimates
                WHERE rowid_accounts = account_id
            )
            WHERE glide_row_id = account_id;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_account_balance_from_related() IS 'Updates account balance when related estimates change';

-- Step 17: Create trigger for updating account balance
DROP TRIGGER IF EXISTS update_account_balance_estimates ON public.gl_estimates;
CREATE TRIGGER update_account_balance_estimates
AFTER INSERT OR UPDATE OR DELETE
ON public.gl_estimates
FOR EACH ROW
EXECUTE FUNCTION public.update_account_balance_from_related();

-- Step 18: Update gl_mappings table to preserve existing column mappings
UPDATE gl_mappings
SET column_mappings = jsonb_build_object(
    '$rowID', jsonb_build_object('data_type', 'string', 'glide_column_name', '$rowID', 'supabase_column_name', 'glide_row_id'),
    'dfHPB', jsonb_build_object('data_type', 'string', 'glide_column_name', 'rowIDsAccountRowIdEstimates', 'supabase_column_name', 'rowid_accounts'),
    '2rohL', jsonb_build_object('data_type', 'date-time', 'glide_column_name', 'mainEstimateDate', 'supabase_column_name', 'estimate_date'),
    '7PKqg', jsonb_build_object('data_type', 'boolean', 'glide_column_name', 'validFinalCreateInvoiceClicked', 'supabase_column_name', 'valid_final_create_invoice_clicked'),
    '8kUfc', jsonb_build_object('data_type', 'string', 'glide_column_name', 'rowIDsInvoiceCreated', 'supabase_column_name', 'rowid_invoices'),
    'A38ad', jsonb_build_object('data_type', 'date-time', 'glide_column_name', 'dateInvoiceCreatedDate', 'supabase_column_name', 'date_invoice_created_date'),
    'IaqqJ', jsonb_build_object('data_type', 'string', 'glide_column_name', 'shortlinkPdf2', 'supabase_column_name', 'glide_pdf_url2'),
    'hMIgK', jsonb_build_object('data_type', 'string', 'glide_column_name', 'shortLinkPdf', 'supabase_column_name', 'glide_pdf_url'),
    'ue5u6', jsonb_build_object('data_type', 'boolean', 'glide_column_name', 'mainIsASample', 'supabase_column_name', 'is_a_sample'),
    'urkYc', jsonb_build_object('data_type', 'boolean', 'glide_column_name', 'addNote', 'supabase_column_name', 'add_note')
)
WHERE supabase_table = 'gl_estimates'
AND id = '692ba74d-85b7-4a0b-b65c-a296a9fadeeb';

-- For gl_estimate_lines
UPDATE gl_mappings
SET column_mappings = jsonb_build_object(
    '$rowID', jsonb_build_object('data_type', 'string', 'glide_column_name', '$rowID', 'supabase_column_name', 'glide_row_id'),
    'U7kk1', jsonb_build_object('data_type', 'string', 'glide_column_name', 'rowidEstimateRowIdFromline', 'supabase_column_name', 'rowid_estimates'),
    'buNIT', jsonb_build_object('data_type', 'string', 'glide_column_name', 'rowidProductIdEstlineItems', 'supabase_column_name', 'rowid_products'),
    'JYsht', jsonb_build_object('data_type', 'date-time', 'glide_column_name', 'mainDateOfSale', 'supabase_column_name', 'date_of_sale'),
    'OqNoP', jsonb_build_object('data_type', 'number', 'glide_column_name', 'mainQtySold', 'supabase_column_name', 'qty_sold'),
    'eXAu8', jsonb_build_object('data_type', 'number', 'glide_column_name', 'mainTotalStockAfterSell', 'supabase_column_name', 'total_stock_after_sell'),
    'mWWKL', jsonb_build_object('data_type', 'number', 'glide_column_name', 'mainSellingPrice', 'supabase_column_name', 'selling_price'),
    'nwJF0', jsonb_build_object('data_type', 'string', 'glide_column_name', 'mainProductSaleNote', 'supabase_column_name', 'product_sale_note'),
    'yuAoI', jsonb_build_object('data_type', 'string', 'glide_column_name', 'mainSaleProductName', 'supabase_column_name', 'sale_product_name')
)
WHERE supabase_table = 'gl_estimate_lines'
AND id = 'e16f5d92-7227-463a-8951-2e9f24c6540b';

-- Step 21: Re-enable triggers
SET session_replication_role = 'origin';

-- Step 22: Add a final notice
DO $$
BEGIN
    RAISE NOTICE 'GL Estimates and GL Estimate Lines tables have been recreated with proper structure and triggers.';
    RAISE NOTICE 'These tables now follow the standard Glidebase pattern for syncing with no special handling required.';
END $$;
