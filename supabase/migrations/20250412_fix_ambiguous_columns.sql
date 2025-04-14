-- Fix for ambiguous po_count column in budget_variance_analysis_view

CREATE OR REPLACE VIEW budget_variance_analysis_view AS
WITH 
-- Define time periods for current and previous (budget proxy) periods
current_period AS (
    SELECT
        DATE_TRUNC('month', CURRENT_DATE)::DATE AS start_date,
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE AS end_date
),

previous_period AS (
    SELECT
        (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 year')::DATE AS start_date,
        (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 year' + INTERVAL '1 month - 1 day')::DATE AS end_date
),

-- Current Period Revenue
current_revenue AS (
    SELECT 
        DATE_TRUNC('month', i.invoice_order_date)::DATE AS month,
        COUNT(i.id) AS invoice_count,
        COALESCE(SUM(i.total_amount), 0) AS total_revenue
    FROM 
        gl_invoices i
    WHERE 
        i.invoice_order_date BETWEEN (SELECT start_date FROM current_period) AND (SELECT end_date FROM current_period)
    GROUP BY 
        DATE_TRUNC('month', i.invoice_order_date)::DATE
),

-- Previous Period Revenue (Budget Proxy)
previous_revenue AS (
    SELECT 
        DATE_TRUNC('month', i.invoice_order_date)::DATE AS month,
        COUNT(i.id) AS invoice_count,
        COALESCE(SUM(i.total_amount), 0) AS total_revenue
    FROM 
        gl_invoices i
    WHERE 
        i.invoice_order_date BETWEEN (SELECT start_date FROM previous_period) AND (SELECT end_date FROM previous_period)
    GROUP BY 
        DATE_TRUNC('month', i.invoice_order_date)::DATE
),

-- Current Period Expenses by Category
current_expenses AS (
    SELECT 
        COALESCE(e.category, 'Uncategorized') AS expense_category,
        COUNT(e.id) AS expense_count,
        COALESCE(SUM(e.amount), 0) AS total_amount
    FROM 
        gl_expenses e
    WHERE 
        e.date BETWEEN (SELECT start_date FROM current_period) AND (SELECT end_date FROM current_period)
    GROUP BY 
        e.category
),

-- Previous Period Expenses by Category (Budget Proxy)
previous_expenses AS (
    SELECT 
        COALESCE(e.category, 'Uncategorized') AS expense_category,
        COUNT(e.id) AS expense_count,
        COALESCE(SUM(e.amount), 0) AS total_amount
    FROM 
        gl_expenses e
    WHERE 
        e.date BETWEEN (SELECT start_date FROM previous_period) AND (SELECT end_date FROM previous_period)
    GROUP BY 
        e.category
),

-- Current Period Purchase Orders
current_purchase_orders AS (
    SELECT 
        COUNT(po.id) AS current_po_count, -- Fixed: Renamed to current_po_count
        COALESCE(SUM(po.total_amount), 0) AS total_amount,
        COALESCE(SUM(po.total_paid), 0) AS total_paid,
        COALESCE(SUM(po.balance), 0) AS total_balance
    FROM 
        gl_purchase_orders po
    WHERE 
        po.po_date BETWEEN (SELECT start_date FROM current_period) AND (SELECT end_date FROM current_period)
),

-- Previous Period Purchase Orders (Budget Proxy)
previous_purchase_orders AS (
    SELECT 
        COUNT(po.id) AS previous_po_count, -- Fixed: Renamed to previous_po_count
        COALESCE(SUM(po.total_amount), 0) AS total_amount,
        COALESCE(SUM(po.total_paid), 0) AS total_paid,
        COALESCE(SUM(po.balance), 0) AS total_balance
    FROM 
        gl_purchase_orders po
    WHERE 
        po.po_date BETWEEN (SELECT start_date FROM previous_period) AND (SELECT end_date FROM previous_period)
),

-- Current Period Product Sales by Category
current_product_sales AS (
    SELECT 
        COALESCE(p.category, 'Uncategorized') AS product_category,
        COUNT(DISTINCT il.id) AS line_count,
        COALESCE(SUM(il.qty_sold), 0) AS quantity_sold,
        COALESCE(SUM(il.line_total), 0) AS total_amount
    FROM 
        gl_invoice_lines il
    LEFT JOIN 
        gl_products p ON il.rowid_products = p.glide_row_id
    LEFT JOIN 
        gl_invoices i ON il.rowid_invoices = i.glide_row_id
    WHERE 
        i.invoice_order_date BETWEEN (SELECT start_date FROM current_period) AND (SELECT end_date FROM current_period)
    GROUP BY 
        p.category
),

-- Previous Period Product Sales by Category (Budget Proxy)
previous_product_sales AS (
    SELECT 
        COALESCE(p.category, 'Uncategorized') AS product_category,
        COUNT(DISTINCT il.id) AS line_count,
        COALESCE(SUM(il.qty_sold), 0) AS quantity_sold,
        COALESCE(SUM(il.line_total), 0) AS total_amount
    FROM 
        gl_invoice_lines il
    LEFT JOIN 
        gl_products p ON il.rowid_products = p.glide_row_id
    LEFT JOIN 
        gl_invoices i ON il.rowid_invoices = i.glide_row_id
    WHERE 
        i.invoice_order_date BETWEEN (SELECT start_date FROM previous_period) AND (SELECT end_date FROM previous_period)
    GROUP BY 
        p.category
),

-- Calculate Variances

-- Revenue Variance
revenue_variance AS (
    SELECT
        'Revenue' AS metric,
        COALESCE((SELECT total_revenue FROM current_revenue), 0) AS current_amount,
        COALESCE((SELECT total_revenue FROM previous_revenue), 0) AS budget_amount,
        COALESCE((SELECT total_revenue FROM current_revenue), 0) - COALESCE((SELECT total_revenue FROM previous_revenue), 0) AS variance_amount,
        CASE
            WHEN COALESCE((SELECT total_revenue FROM previous_revenue), 0) = 0 THEN NULL
            ELSE (COALESCE((SELECT total_revenue FROM current_revenue), 0) - COALESCE((SELECT total_revenue FROM previous_revenue), 0)) / 
                 NULLIF(COALESCE((SELECT total_revenue FROM previous_revenue), 0), 0) * 100
        END AS variance_percent
),

-- Expense Variance by Category
expense_variance AS (
    SELECT
        'Expense: ' || ce.expense_category AS metric,
        ce.total_amount AS current_amount,
        COALESCE(pe.total_amount, 0) AS budget_amount,
        ce.total_amount - COALESCE(pe.total_amount, 0) AS variance_amount,
        CASE
            WHEN COALESCE(pe.total_amount, 0) = 0 THEN NULL
            ELSE (ce.total_amount - COALESCE(pe.total_amount, 0)) / NULLIF(COALESCE(pe.total_amount, 0), 0) * 100
        END AS variance_percent
    FROM
        current_expenses ce
    LEFT JOIN
        previous_expenses pe ON ce.expense_category = pe.expense_category
    UNION ALL
    SELECT
        'Expense: ' || pe.expense_category AS metric,
        COALESCE(ce.total_amount, 0) AS current_amount,
        pe.total_amount AS budget_amount,
        COALESCE(ce.total_amount, 0) - pe.total_amount AS variance_amount,
        CASE
            WHEN pe.total_amount = 0 THEN NULL
            ELSE (COALESCE(ce.total_amount, 0) - pe.total_amount) / pe.total_amount * 100
        END AS variance_percent
    FROM
        previous_expenses pe
    LEFT JOIN
        current_expenses ce ON pe.expense_category = ce.expense_category
    WHERE
        ce.expense_category IS NULL
),

-- Purchase Order Variance
purchase_order_variance AS (
    SELECT
        'Purchase Orders' AS metric,
        COALESCE((SELECT total_amount FROM current_purchase_orders), 0) AS current_amount,
        COALESCE((SELECT total_amount FROM previous_purchase_orders), 0) AS budget_amount,
        COALESCE((SELECT total_amount FROM current_purchase_orders), 0) - COALESCE((SELECT total_amount FROM previous_purchase_orders), 0) AS variance_amount,
        CASE
            WHEN COALESCE((SELECT total_amount FROM previous_purchase_orders), 0) = 0 THEN NULL
            ELSE (COALESCE((SELECT total_amount FROM current_purchase_orders), 0) - COALESCE((SELECT total_amount FROM previous_purchase_orders), 0)) / 
                 NULLIF(COALESCE((SELECT total_amount FROM previous_purchase_orders), 0), 0) * 100
        END AS variance_percent
),

-- Product Sales Variance by Category
product_sales_variance AS (
    SELECT
        'Product Sales: ' || cps.product_category AS metric,
        cps.total_amount AS current_amount,
        COALESCE(pps.total_amount, 0) AS budget_amount,
        cps.total_amount - COALESCE(pps.total_amount, 0) AS variance_amount,
        CASE
            WHEN COALESCE(pps.total_amount, 0) = 0 THEN NULL
            ELSE (cps.total_amount - COALESCE(pps.total_amount, 0)) / NULLIF(COALESCE(pps.total_amount, 0), 0) * 100
        END AS variance_percent
    FROM
        current_product_sales cps
    LEFT JOIN
        previous_product_sales pps ON cps.product_category = pps.product_category
    UNION ALL
    SELECT
        'Product Sales: ' || pps.product_category AS metric,
        COALESCE(cps.total_amount, 0) AS current_amount,
        pps.total_amount AS budget_amount,
        COALESCE(cps.total_amount, 0) - pps.total_amount AS variance_amount,
        CASE
            WHEN pps.total_amount = 0 THEN NULL
            ELSE (COALESCE(cps.total_amount, 0) - pps.total_amount) / pps.total_amount * 100
        END AS variance_percent
    FROM
        previous_product_sales pps
    LEFT JOIN
        current_product_sales cps ON pps.product_category = cps.product_category
    WHERE
        cps.product_category IS NULL
)

-- Combine all variances
SELECT 
    (SELECT start_date FROM current_period) AS current_period_start,
    (SELECT end_date FROM current_period) AS current_period_end,
    (SELECT start_date FROM previous_period) AS comparison_period_start,
    (SELECT end_date FROM previous_period) AS comparison_period_end,
    metric,
    current_amount,
    budget_amount,
    variance_amount,
    variance_percent,
    CASE 
        WHEN variance_amount > 0 AND metric LIKE 'Revenue%' THEN 'Favorable'
        WHEN variance_amount < 0 AND metric LIKE 'Revenue%' THEN 'Unfavorable'
        WHEN variance_amount < 0 AND metric LIKE 'Expense%' THEN 'Favorable'
        WHEN variance_amount > 0 AND metric LIKE 'Expense%' THEN 'Unfavorable'
        WHEN variance_amount < 0 AND metric LIKE 'Purchase Orders%' THEN 'Favorable'
        WHEN variance_amount > 0 AND metric LIKE 'Purchase Orders%' THEN 'Unfavorable'
        WHEN variance_amount > 0 AND metric LIKE 'Product Sales%' THEN 'Favorable'
        WHEN variance_amount < 0 AND metric LIKE 'Product Sales%' THEN 'Unfavorable'
        ELSE 'Neutral'
    END AS performance
FROM (
    SELECT * FROM revenue_variance
    UNION ALL
    SELECT * FROM expense_variance
    UNION ALL
    SELECT * FROM purchase_order_variance
    UNION ALL
    SELECT * FROM product_sales_variance
) AS combined_variance
ORDER BY 
    CASE 
        WHEN metric = 'Revenue' THEN 1
        WHEN metric LIKE 'Product Sales%' THEN 2
        WHEN metric LIKE 'Expense%' THEN 3
        WHEN metric = 'Purchase Orders' THEN 4
        ELSE 5
    END,
    metric;

-- Also fix the financial metrics function that uses purchase orders

CREATE OR REPLACE FUNCTION public.gl_get_purchase_order_metrics()
RETURNS TABLE (
    total_purchase_amount numeric,
    received_purchase_amount numeric,
    pending_purchase_amount numeric,
    purchase_count bigint,
    received_purchase_count bigint,
    pending_purchase_count bigint,
    avg_purchase_amount numeric
) LANGUAGE sql AS $$
    SELECT 
        COALESCE(SUM(total_amount), 0) AS total_purchase_amount,
        COALESCE(SUM(CASE WHEN status = 'received' THEN total_amount ELSE 0 END), 0) AS received_purchase_amount,
        COALESCE(SUM(CASE WHEN status != 'received' OR status IS NULL THEN total_amount ELSE 0 END), 0) AS pending_purchase_amount,
        COUNT(*) AS purchase_count,
        COUNT(CASE WHEN status = 'received' THEN 1 END) AS received_purchase_count,
        COUNT(CASE WHEN status != 'received' OR status IS NULL THEN 1 END) AS pending_purchase_count,
        CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*) ELSE 0 END AS avg_purchase_amount
    FROM gl_purchase_orders
    WHERE po_date >= CURRENT_DATE - INTERVAL '365 days'
$$;
