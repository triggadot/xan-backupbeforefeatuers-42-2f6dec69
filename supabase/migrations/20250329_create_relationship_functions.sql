-- Helper functions to simplify navigating relationships between tables
-- These functions leverage the Glidebase rowid_ pattern

-- Function to get account details by glide_row_id
CREATE OR REPLACE FUNCTION public.get_account_by_glide_id(account_glide_id text)
RETURNS TABLE (
    id uuid,
    glide_row_id text,
    account_name text,
    client_type text,
    accounts_uid text,
    balance numeric,
    photo text,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id, 
        a.glide_row_id, 
        a.account_name, 
        a.client_type, 
        a.accounts_uid, 
        a.balance,
        a.photo,
        a.created_at,
        a.updated_at
    FROM 
        public.gl_accounts a
    WHERE 
        a.glide_row_id = account_glide_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get invoice lines by invoice glide_row_id
CREATE OR REPLACE FUNCTION public.get_invoice_lines_by_invoice(invoice_glide_id text)
RETURNS TABLE (
    id uuid,
    glide_row_id text,
    renamed_product_name text,
    rowid_products text,
    qty_sold numeric,
    selling_price numeric,
    line_total numeric,
    display_name text,
    product_sale_note text,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        il.id, 
        il.glide_row_id, 
        il.renamed_product_name, 
        il.rowid_products, 
        il.qty_sold, 
        il.selling_price, 
        il.line_total,
        il.display_name,
        il.product_sale_note,
        il.created_at,
        il.updated_at
    FROM 
        public.gl_invoice_lines il
    WHERE 
        il.rowid_invoices = invoice_glide_id
    ORDER BY
        il.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get estimate lines by estimate glide_row_id
CREATE OR REPLACE FUNCTION public.get_estimate_lines_by_estimate(estimate_glide_id text)
RETURNS TABLE (
    id uuid,
    glide_row_id text,
    sale_product_name text,
    rowid_products text,
    qty_sold numeric,
    selling_price numeric,
    line_total numeric,
    display_name text,
    product_sale_note text,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        el.id, 
        el.glide_row_id, 
        el.sale_product_name, 
        el.rowid_products, 
        el.qty_sold, 
        el.selling_price, 
        el.line_total,
        el.display_name,
        el.product_sale_note,
        el.created_at,
        el.updated_at
    FROM 
        public.gl_estimate_lines el
    WHERE 
        el.rowid_estimates = estimate_glide_id
    ORDER BY
        el.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get products by purchase order glide_row_id
CREATE OR REPLACE FUNCTION public.get_products_by_purchase_order(po_glide_id text)
RETURNS TABLE (
    id uuid,
    glide_row_id text,
    vendor_product_name text,
    new_product_name text,
    total_qty_purchased numeric,
    cost numeric,
    display_name text,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.glide_row_id, 
        p.vendor_product_name, 
        p.new_product_name, 
        p.total_qty_purchased, 
        p.cost,
        COALESCE(p.new_product_name, p.vendor_product_name) as display_name,
        p.created_at,
        p.updated_at
    FROM 
        public.gl_products p
    WHERE 
        p.rowid_purchase_orders = po_glide_id
    ORDER BY
        p.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get all payments for an invoice
CREATE OR REPLACE FUNCTION public.get_payments_by_invoice(invoice_glide_id text)
RETURNS TABLE (
    id uuid,
    glide_row_id text,
    main_payment_amount numeric,
    payment_date timestamptz,
    payment_method text,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id, 
        cp.glide_row_id, 
        cp.main_payment_amount, 
        cp.payment_date, 
        cp.payment_method,
        cp.created_at,
        cp.updated_at
    FROM 
        public.gl_customer_payments cp
    WHERE 
        cp.rowid_invoices = invoice_glide_id
    ORDER BY
        cp.payment_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get all credits for an estimate
CREATE OR REPLACE FUNCTION public.get_credits_by_estimate(estimate_glide_id text)
RETURNS TABLE (
    id uuid,
    glide_row_id text,
    credit_amount numeric,
    credit_date timestamptz,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id, 
        cc.glide_row_id, 
        cc.credit_amount, 
        cc.created_at as credit_date,
        cc.created_at,
        cc.updated_at
    FROM 
        public.gl_customer_credits cc
    WHERE 
        cc.rowid_estimates = estimate_glide_id
    ORDER BY
        cc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get complete invoice data with all relationships
CREATE OR REPLACE FUNCTION public.get_complete_invoice(invoice_glide_id text)
RETURNS jsonb AS $$
DECLARE
    invoice_data jsonb;
    account_data jsonb;
    lines_data jsonb;
    payments_data jsonb;
BEGIN
    -- Get the invoice
    SELECT row_to_json(i)::jsonb INTO invoice_data
    FROM public.gl_invoices i
    WHERE i.glide_row_id = invoice_glide_id;
    
    IF invoice_data IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get the account
    SELECT row_to_json(a)::jsonb INTO account_data
    FROM public.gl_accounts a
    WHERE a.glide_row_id = (invoice_data->>'rowid_accounts');
    
    -- Get the lines with product info
    SELECT jsonb_agg(
        jsonb_build_object(
            'line', row_to_json(il)::jsonb,
            'product', CASE 
                WHEN il.rowid_products IS NOT NULL THEN 
                    (SELECT row_to_json(p)::jsonb 
                     FROM public.gl_products p 
                     WHERE p.glide_row_id = il.rowid_products)
                ELSE NULL
            END
        )
    ) INTO lines_data
    FROM public.gl_invoice_lines il
    WHERE il.rowid_invoices = invoice_glide_id;
    
    -- Get the payments
    SELECT jsonb_agg(row_to_json(cp)::jsonb) INTO payments_data
    FROM public.gl_customer_payments cp
    WHERE cp.rowid_invoices = invoice_glide_id;
    
    -- Combine everything
    RETURN jsonb_build_object(
        'invoice', invoice_data,
        'account', account_data,
        'lines', COALESCE(lines_data, '[]'::jsonb),
        'payments', COALESCE(payments_data, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get complete estimate data with all relationships
CREATE OR REPLACE FUNCTION public.get_complete_estimate(estimate_glide_id text)
RETURNS jsonb AS $$
DECLARE
    estimate_data jsonb;
    account_data jsonb;
    lines_data jsonb;
    credits_data jsonb;
BEGIN
    -- Get the estimate
    SELECT row_to_json(e)::jsonb INTO estimate_data
    FROM public.gl_estimates e
    WHERE e.glide_row_id = estimate_glide_id;
    
    IF estimate_data IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get the account
    SELECT row_to_json(a)::jsonb INTO account_data
    FROM public.gl_accounts a
    WHERE a.glide_row_id = (estimate_data->>'rowid_accounts');
    
    -- Get the lines with product info
    SELECT jsonb_agg(
        jsonb_build_object(
            'line', row_to_json(el)::jsonb,
            'product', CASE 
                WHEN el.rowid_products IS NOT NULL THEN 
                    (SELECT row_to_json(p)::jsonb 
                     FROM public.gl_products p 
                     WHERE p.glide_row_id = el.rowid_products)
                ELSE NULL
            END
        )
    ) INTO lines_data
    FROM public.gl_estimate_lines el
    WHERE el.rowid_estimates = estimate_glide_id;
    
    -- Get the credits
    SELECT jsonb_agg(row_to_json(cc)::jsonb) INTO credits_data
    FROM public.gl_customer_credits cc
    WHERE cc.rowid_estimates = estimate_glide_id;
    
    -- Combine everything
    RETURN jsonb_build_object(
        'estimate', estimate_data,
        'account', account_data,
        'lines', COALESCE(lines_data, '[]'::jsonb),
        'credits', COALESCE(credits_data, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;
