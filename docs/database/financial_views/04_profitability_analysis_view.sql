-- Profitability Analysis View
-- This view provides detailed profitability analysis by product, customer, and category
-- It also includes overall business profitability metrics

CREATE OR REPLACE VIEW profitability_analysis_view AS
WITH 
-- Time period for analysis
analysis_period AS (
    SELECT
        CURRENT_DATE - INTERVAL '1 year' AS start_date,
        CURRENT_DATE AS end_date
),

-- Product Profitability
product_profitability AS (
    SELECT 
        p.id::TEXT AS product_id,
        COALESCE(p.display_name, 'Unknown')::TEXT AS product_name,
        COALESCE(p.category, 'Uncategorized')::TEXT AS product_category,
        COALESCE(SUM(il.qty_sold), 0)::NUMERIC AS total_quantity_sold,
        COALESCE(SUM(il.line_total), 0)::NUMERIC AS total_revenue,
        COALESCE(SUM(CASE WHEN p.cost IS NOT NULL THEN p.cost * il.qty_sold ELSE 0 END), 0)::NUMERIC AS total_cost,
        (COALESCE(SUM(il.line_total), 0) - COALESCE(SUM(CASE WHEN p.cost IS NOT NULL THEN p.cost * il.qty_sold ELSE 0 END), 0))::NUMERIC AS gross_profit,
        CASE 
            WHEN COALESCE(SUM(il.line_total), 0) = 0 THEN NULL
            ELSE ((COALESCE(SUM(il.line_total), 0) - COALESCE(SUM(CASE WHEN p.cost IS NOT NULL THEN p.cost * il.qty_sold ELSE 0 END), 0)) / 
                 NULLIF(COALESCE(SUM(il.line_total), 0), 0) * 100)::NUMERIC
        END AS gross_profit_margin_pct
    FROM 
        gl_products p
    LEFT JOIN 
        gl_invoice_lines il ON p.glide_row_id = il.rowid_products
    LEFT JOIN 
        gl_invoices i ON il.rowid_invoices = i.glide_row_id
    WHERE 
        i.invoice_order_date BETWEEN (SELECT start_date FROM analysis_period) AND (SELECT end_date FROM analysis_period)
        OR i.invoice_order_date IS NULL
    GROUP BY 
        p.id, p.display_name, p.category
),

-- Customer Profitability
customer_profitability AS (
    SELECT 
        a.id::TEXT AS customer_id,
        COALESCE(a.account_name, 'Unknown')::TEXT AS customer_name,
        COALESCE(a.client_type, 'Unknown')::TEXT AS client_type,
        COUNT(DISTINCT i.id)::TEXT AS invoice_count,
        COALESCE(SUM(i.total_amount), 0)::NUMERIC AS total_revenue,
        COALESCE(SUM(
            CASE 
                WHEN p.cost IS NOT NULL AND il.qty_sold IS NOT NULL 
                THEN p.cost * il.qty_sold
                ELSE 0
            END
        ), 0)::NUMERIC AS total_cost,
        (COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(
            CASE 
                WHEN p.cost IS NOT NULL AND il.qty_sold IS NOT NULL 
                THEN p.cost * il.qty_sold
                ELSE 0
            END
        ), 0))::NUMERIC AS gross_profit,
        CASE 
            WHEN COALESCE(SUM(i.total_amount), 0) = 0 THEN NULL
            ELSE ((COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(
                CASE 
                    WHEN p.cost IS NOT NULL AND il.qty_sold IS NOT NULL 
                    THEN p.cost * il.qty_sold
                    ELSE 0
                END
            ), 0)) / NULLIF(COALESCE(SUM(i.total_amount), 0), 0) * 100)::NUMERIC
        END AS gross_profit_margin_pct,
        COALESCE(a.customer_balance, 0)::NUMERIC AS current_receivable_balance
    FROM 
        gl_accounts a
    LEFT JOIN 
        gl_invoices i ON a.glide_row_id = i.rowid_accounts
    LEFT JOIN 
        gl_invoice_lines il ON i.glide_row_id = il.rowid_invoices
    LEFT JOIN 
        gl_products p ON il.rowid_products = p.glide_row_id
    WHERE 
        (a.client_type = 'Customer' OR a.client_type = 'Customer & Vendor')
        AND (i.invoice_order_date BETWEEN (SELECT start_date FROM analysis_period) AND (SELECT end_date FROM analysis_period)
             OR i.invoice_order_date IS NULL)
    GROUP BY 
        a.id, a.account_name, a.client_type, a.customer_balance
),

-- Category Profitability
category_profitability AS (
    SELECT 
        COALESCE(p.category, 'Uncategorized')::TEXT AS category,
        COUNT(DISTINCT p.id)::TEXT AS product_count,
        COALESCE(SUM(il.qty_sold), 0)::NUMERIC AS total_quantity_sold,
        COALESCE(SUM(il.line_total), 0)::NUMERIC AS total_revenue,
        COALESCE(SUM(CASE WHEN p.cost IS NOT NULL THEN p.cost * il.qty_sold ELSE 0 END), 0)::NUMERIC AS total_cost,
        (COALESCE(SUM(il.line_total), 0) - COALESCE(SUM(CASE WHEN p.cost IS NOT NULL THEN p.cost * il.qty_sold ELSE 0 END), 0))::NUMERIC AS gross_profit,
        CASE 
            WHEN COALESCE(SUM(il.line_total), 0) = 0 THEN NULL
            ELSE ((COALESCE(SUM(il.line_total), 0) - COALESCE(SUM(CASE WHEN p.cost IS NOT NULL THEN p.cost * il.qty_sold ELSE 0 END), 0)) / 
                 NULLIF(COALESCE(SUM(il.line_total), 0), 0) * 100)::NUMERIC
        END AS gross_profit_margin_pct
    FROM 
        gl_products p
    LEFT JOIN 
        gl_invoice_lines il ON p.glide_row_id = il.rowid_products
    LEFT JOIN 
        gl_invoices i ON il.rowid_invoices = i.glide_row_id
    WHERE 
        i.invoice_order_date BETWEEN (SELECT start_date FROM analysis_period) AND (SELECT end_date FROM analysis_period)
        OR i.invoice_order_date IS NULL
    GROUP BY 
        p.category
),

-- Overall Profitability
overall_profitability AS (
    SELECT 
        COUNT(DISTINCT i.id)::TEXT AS total_invoices,
        COUNT(DISTINCT a.id)::TEXT AS total_customers,
        COUNT(DISTINCT p.id)::TEXT AS total_products,
        COALESCE(SUM(i.total_amount), 0)::NUMERIC AS total_revenue,
        COALESCE(SUM(
            CASE 
                WHEN p.cost IS NOT NULL AND il.qty_sold IS NOT NULL 
                THEN p.cost * il.qty_sold
                ELSE 0
            END
        ), 0)::NUMERIC AS total_cost,
        (COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(
            CASE 
                WHEN p.cost IS NOT NULL AND il.qty_sold IS NOT NULL 
                THEN p.cost * il.qty_sold
                ELSE 0
            END
        ), 0))::NUMERIC AS gross_profit,
        CASE 
            WHEN COALESCE(SUM(i.total_amount), 0) = 0 THEN NULL
            ELSE ((COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(
                CASE 
                    WHEN p.cost IS NOT NULL AND il.qty_sold IS NOT NULL 
                    THEN p.cost * il.qty_sold
                    ELSE 0
                END
            ), 0)) / NULLIF(COALESCE(SUM(i.total_amount), 0), 0) * 100)::NUMERIC
        END AS gross_profit_margin_pct
    FROM 
        gl_invoices i
    LEFT JOIN 
        gl_accounts a ON i.rowid_accounts = a.glide_row_id
    LEFT JOIN 
        gl_invoice_lines il ON i.glide_row_id = il.rowid_invoices
    LEFT JOIN 
        gl_products p ON il.rowid_products = p.glide_row_id
    WHERE 
        i.invoice_order_date BETWEEN (SELECT start_date FROM analysis_period) AND (SELECT end_date FROM analysis_period)
)

-- Main query that returns all sections
SELECT
    'overall'::TEXT AS analysis_type,
    NULL::TEXT AS entity_id,
    'Overall Business'::TEXT AS entity_name,
    NULL::TEXT AS entity_category,
    NULL::TEXT AS invoice_count,
    NULL::TEXT AS product_count,
    NULL::NUMERIC AS total_quantity_sold,
    total_revenue,
    total_cost,
    gross_profit,
    gross_profit_margin_pct,
    NULL::NUMERIC AS current_receivable_balance
FROM 
    overall_profitability

UNION ALL

SELECT
    'product'::TEXT AS analysis_type,
    product_id,
    product_name,
    product_category,
    NULL::TEXT AS invoice_count,
    NULL::TEXT AS product_count,
    total_quantity_sold,
    total_revenue,
    total_cost,
    gross_profit,
    gross_profit_margin_pct,
    NULL::NUMERIC AS current_receivable_balance
FROM 
    product_profitability

UNION ALL

SELECT
    'customer'::TEXT AS analysis_type,
    customer_id,
    customer_name,
    client_type,
    invoice_count,
    NULL::TEXT AS product_count,
    NULL::NUMERIC AS total_quantity_sold,
    total_revenue,
    total_cost,
    gross_profit,
    gross_profit_margin_pct,
    current_receivable_balance
FROM 
    customer_profitability

UNION ALL

SELECT
    'category'::TEXT AS analysis_type,
    NULL::TEXT AS entity_id,
    category,
    NULL::TEXT AS entity_category,
    NULL::TEXT AS invoice_count,
    product_count,
    total_quantity_sold,
    total_revenue,
    total_cost,
    gross_profit,
    gross_profit_margin_pct,
    NULL::NUMERIC AS current_receivable_balance
FROM 
    category_profitability; 