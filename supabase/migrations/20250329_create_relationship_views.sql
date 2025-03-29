-- Create materialized views for common join patterns
-- These views pre-join related tables to simplify queries and improve performance

-- Create view for invoices with account information
CREATE OR REPLACE VIEW public.mv_invoice_with_account AS
SELECT 
    i.*,
    a.account_name,
    a.client_type,
    a.accounts_uid,
    a.photo as account_photo
FROM 
    public.gl_invoices i
LEFT JOIN 
    public.gl_accounts a ON i.rowid_accounts = a.glide_row_id;

-- Create view for invoice lines with product information
CREATE OR REPLACE VIEW public.mv_invoice_lines_with_products AS
SELECT 
    il.*,
    p.vendor_product_name,
    p.new_product_name,
    COALESCE(p.new_product_name, p.vendor_product_name) as product_display_name,
    p.cost as product_cost
FROM 
    public.gl_invoice_lines il
LEFT JOIN 
    public.gl_products p ON il.rowid_products = p.glide_row_id;

-- Create view for purchase orders with vendor information
CREATE OR REPLACE VIEW public.mv_purchase_orders_with_vendor AS
SELECT 
    po.*,
    a.account_name as vendor_name,
    a.accounts_uid as vendor_uid,
    a.photo as vendor_photo
FROM 
    public.gl_purchase_orders po
LEFT JOIN 
    public.gl_accounts a ON po.rowid_accounts = a.glide_row_id;

-- Create view for products with purchase order information
CREATE OR REPLACE VIEW public.mv_products_with_purchase_order AS
SELECT 
    p.*,
    po.purchase_order_uid,
    po.po_date,
    a.account_name as vendor_name
FROM 
    public.gl_products p
LEFT JOIN 
    public.gl_purchase_orders po ON p.rowid_purchase_orders = po.glide_row_id
LEFT JOIN 
    public.gl_accounts a ON po.rowid_accounts = a.glide_row_id;

-- Create view for estimates with account information
CREATE OR REPLACE VIEW public.mv_estimates_with_account AS
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

-- Create view for invoice with all related data (account, lines, products)
CREATE OR REPLACE VIEW public.mv_invoice_complete AS
SELECT 
    i.*,
    a.account_name,
    a.client_type,
    a.accounts_uid,
    jsonb_agg(
        jsonb_build_object(
            'id', il.id,
            'glide_row_id', il.glide_row_id,
            'renamed_product_name', il.renamed_product_name,
            'display_name', COALESCE(il.renamed_product_name, p.new_product_name, p.vendor_product_name),
            'qty_sold', il.qty_sold,
            'selling_price', il.selling_price,
            'line_total', il.line_total,
            'product_data', jsonb_build_object(
                'id', p.id,
                'glide_row_id', p.glide_row_id,
                'vendor_product_name', p.vendor_product_name,
                'new_product_name', p.new_product_name
            )
        )
    ) FILTER (WHERE il.id IS NOT NULL) AS invoice_lines
FROM 
    public.gl_invoices i
LEFT JOIN 
    public.gl_accounts a ON i.rowid_accounts = a.glide_row_id
LEFT JOIN 
    public.gl_invoice_lines il ON il.rowid_invoices = i.glide_row_id
LEFT JOIN 
    public.gl_products p ON il.rowid_products = p.glide_row_id
GROUP BY
    i.id, i.glide_row_id, a.account_name, a.client_type, a.accounts_uid;
