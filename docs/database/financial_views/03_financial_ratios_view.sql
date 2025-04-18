-- Financial Ratios Analysis View
-- This view calculates key financial ratios based on a 6-month comparison period
-- Includes profitability, liquidity, activity ratios, and growth metrics

CREATE OR REPLACE VIEW financial_ratios_view AS
WITH 
-- Time periods for comparison
current_period AS (
    SELECT
        CURRENT_DATE - INTERVAL '6 months' AS start_date,
        CURRENT_DATE AS end_date
),

previous_period AS (
    SELECT
        (SELECT start_date FROM current_period) - INTERVAL '6 months' AS start_date,
        (SELECT start_date FROM current_period) - INTERVAL '1 day' AS end_date
),

-- Current Period Metrics
current_revenue AS (
    SELECT 
        COALESCE(SUM(total_amount), 0) AS total_amount
    FROM 
        gl_invoices
    WHERE 
        date_of_invoice(SELECT start_date FROM current_period) AND (SELECT end_date FROM current_period)
),

current_cogs AS (
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN p.cost IS NOT NULL AND il.qty_sold IS NOT NULL 
                THEN p.cost * il.qty_sold
                ELSE 0
            END
        ), 0) AS total_amount
    FROM 
        gl_invoice_lines il
    LEFT JOIN 
        gl_products p ON il.rowid_products = p.glide_row_id
    LEFT JOIN 
        gl_invoices i ON il.rowid_invoices = i.glide_row_id
    WHERE 
        i.date_of_invoice BETWEEN (SELECT start_date FROM current_period) AND (SELECT end_date FROM current_period)
),

current_expenses AS (
    SELECT 
        COALESCE(SUM(amount), 0) AS total_amount
    FROM 
        gl_expenses
    WHERE 
        date BETWEEN (SELECT start_date FROM current_period) AND (SELECT end_date FROM current_period)
),

current_accounts_receivable AS (
    SELECT 
        COALESCE(SUM(customer_balance), 0) AS total_amount
    FROM 
        gl_accounts
    WHERE 
        customer_balance > 0
),

current_inventory AS (
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN samples = true OR fronted = true THEN 0
                ELSE (total_cost)
            END
        ), 0) AS total_amount
    FROM 
        gl_products
),

current_accounts_payable AS (
    SELECT 
        COALESCE(SUM(ABS(vendor_balance)), 0) AS total_amount
    FROM 
        gl_accounts
    WHERE 
        vendor_balance < 0
),

-- Previous Period Metrics
previous_revenue AS (
    SELECT 
        COALESCE(SUM(total_amount), 0) AS total_amount
    FROM 
        gl_invoices
    WHERE 
        date_of_invoice BETWEEN (SELECT start_date FROM previous_period) AND (SELECT end_date FROM previous_period)
),

previous_cogs AS (
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN p.cost IS NOT NULL AND il.qty_sold IS NOT NULL 
                THEN p.cost * il.qty_sold
                ELSE 0
            END
        ), 0) AS total_amount
    FROM 
        gl_invoice_lines il
    LEFT JOIN 
        gl_products p ON il.rowid_products = p.glide_row_id
    LEFT JOIN 
        gl_invoices i ON il.rowid_invoices = i.glide_row_id
    WHERE 
        i.date_of_invoice BETWEEN (SELECT start_date FROM previous_period) AND (SELECT end_date FROM previous_period)
),

previous_expenses AS (
    SELECT 
        COALESCE(SUM(amount), 0) AS total_amount
    FROM 
        gl_expenses
    WHERE 
        date BETWEEN (SELECT start_date FROM previous_period) AND (SELECT end_date FROM previous_period)
),

-- Derived Metrics
current_gross_profit AS (
    SELECT 
        (SELECT total_amount FROM current_revenue) - 
        (SELECT total_amount FROM current_cogs) AS total_amount
),

current_net_profit AS (
    SELECT 
        (SELECT total_amount FROM current_gross_profit) - 
        (SELECT total_amount FROM current_expenses) AS total_amount
),

previous_gross_profit AS (
    SELECT 
        (SELECT total_amount FROM previous_revenue) - 
        (SELECT total_amount FROM previous_cogs) AS total_amount
),

previous_net_profit AS (
    SELECT 
        (SELECT total_amount FROM previous_gross_profit) - 
        (SELECT total_amount FROM previous_expenses) AS total_amount
),

-- Current assets
current_assets AS (
    SELECT 
        (SELECT total_amount FROM current_accounts_receivable) + 
        (SELECT total_amount FROM current_inventory) AS total_amount
),

-- Current liabilities
current_liabilities AS (
    SELECT 
        (SELECT total_amount FROM current_accounts_payable) AS total_amount
)

-- Main financial ratios query
SELECT
    -- Period information
    (SELECT start_date FROM current_period) AS period_start_date,
    (SELECT end_date FROM current_period) AS period_end_date,
    
    -- Profitability Ratios
    CASE 
        WHEN (SELECT total_amount FROM current_revenue) = 0 THEN NULL
        ELSE ((SELECT total_amount FROM current_gross_profit) / (SELECT total_amount FROM current_revenue)) * 100
    END AS gross_profit_margin_pct,
    
    CASE 
        WHEN (SELECT total_amount FROM current_revenue) = 0 THEN NULL
        ELSE ((SELECT total_amount FROM current_net_profit) / (SELECT total_amount FROM current_revenue)) * 100
    END AS net_profit_margin_pct,
    
    -- Liquidity Ratios
    CASE 
        WHEN (SELECT total_amount FROM current_liabilities) = 0 THEN NULL
        ELSE (SELECT total_amount FROM current_assets) / NULLIF((SELECT total_amount FROM current_liabilities), 0)
    END AS current_ratio,
    
    CASE 
        WHEN (SELECT total_amount FROM current_liabilities) = 0 THEN NULL
        ELSE ((SELECT total_amount FROM current_accounts_receivable) / NULLIF((SELECT total_amount FROM current_liabilities), 0))
    END AS quick_ratio,
    
    -- Activity Ratios
    CASE 
        WHEN (SELECT total_amount FROM current_accounts_receivable) = 0 THEN NULL
        ELSE ((SELECT total_amount FROM current_revenue) / NULLIF((SELECT total_amount FROM current_accounts_receivable), 0)) * (365/180)
    END AS accounts_receivable_turnover,
    
    CASE 
        WHEN (SELECT total_amount FROM current_inventory) = 0 THEN NULL
        ELSE ((SELECT total_amount FROM current_cogs) / NULLIF((SELECT total_amount FROM current_inventory), 0)) * (365/180)
    END AS inventory_turnover,
    
    -- Growth Rates
    CASE 
        WHEN (SELECT total_amount FROM previous_revenue) = 0 THEN NULL
        ELSE (((SELECT total_amount FROM current_revenue) - (SELECT total_amount FROM previous_revenue)) / 
              NULLIF((SELECT total_amount FROM previous_revenue), 0)) * 100
    END AS revenue_growth_pct,
    
    CASE 
        WHEN (SELECT total_amount FROM previous_gross_profit) = 0 THEN NULL
        ELSE (((SELECT total_amount FROM current_gross_profit) - (SELECT total_amount FROM previous_gross_profit)) / 
              NULLIF((SELECT total_amount FROM previous_gross_profit), 0)) * 100
    END AS gross_profit_growth_pct,
    
    CASE 
        WHEN (SELECT total_amount FROM previous_net_profit) = 0 THEN NULL
        ELSE (((SELECT total_amount FROM current_net_profit) - (SELECT total_amount FROM previous_net_profit)) / 
              NULLIF((SELECT total_amount FROM previous_net_profit), 0)) * 100
    END AS net_profit_growth_pct,
    
    -- Raw values for reference
    (SELECT total_amount FROM current_revenue) AS current_period_revenue,
    (SELECT total_amount FROM current_cogs) AS current_period_cogs,
    (SELECT total_amount FROM current_gross_profit) AS current_period_gross_profit,
    (SELECT total_amount FROM current_expenses) AS current_period_expenses,
    (SELECT total_amount FROM current_net_profit) AS current_period_net_profit,
    (SELECT total_amount FROM current_accounts_receivable) AS current_accounts_receivable,
    (SELECT total_amount FROM current_inventory) AS current_inventory,
    (SELECT total_amount FROM current_assets) AS current_assets,
    (SELECT total_amount FROM current_accounts_payable) AS current_accounts_payable,
    (SELECT total_amount FROM current_liabilities) AS current_liabilities,
    
    (SELECT total_amount FROM previous_revenue) AS previous_period_revenue,
    (SELECT total_amount FROM previous_cogs) AS previous_period_cogs,
    (SELECT total_amount FROM previous_gross_profit) AS previous_period_gross_profit,
    (SELECT total_amount FROM previous_expenses) AS previous_period_expenses,
    (SELECT total_amount FROM previous_net_profit) AS previous_period_net_profit; 