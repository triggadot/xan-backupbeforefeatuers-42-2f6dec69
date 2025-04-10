-- Balance Sheet View
-- This view generates a comprehensive balance sheet based on the data in the system
-- It calculates assets, liabilities, equity, and key financial ratios

CREATE OR REPLACE VIEW balance_sheet_view AS
WITH 
-- Current Assets: Customer balances (Accounts Receivable)
accounts_receivable AS (
    SELECT 
        COALESCE(SUM(customer_balance), 0) AS total_amount
    FROM 
        gl_accounts
    WHERE 
        customer_balance > 0
),

-- Customer payments received but not yet applied to invoices
customer_payments_in_transit AS (
    SELECT 
        COALESCE(SUM(cp.payment_amount), 0) AS total_amount
    FROM 
        gl_customer_payments cp
    LEFT JOIN 
        gl_invoices i ON cp.rowid_invoices = i.glide_row_id
    WHERE 
        i.id IS NULL
),

-- Current Liabilities: Vendor balances (Accounts Payable)
accounts_payable AS (
    SELECT 
        COALESCE(SUM(ABS(vendor_balance)), 0) AS total_amount
    FROM 
        gl_accounts
    WHERE 
        vendor_balance < 0
),

-- Unpaid purchase orders
unpaid_purchase_orders AS (
    SELECT 
        COALESCE(SUM(balance), 0) AS total_amount
    FROM 
        gl_purchase_orders
    WHERE 
        payment_status IN ('unpaid', 'partial')
),

-- Inventory value (based on products)
inventory_value AS (
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN p.samples = true OR p.fronted = true THEN 0
                ELSE (p.total_cost)
            END
        ), 0) AS total_amount
    FROM 
        gl_products p
),

-- Total sales (revenue)
total_sales AS (
    SELECT 
        COALESCE(SUM(total_amount), 0) AS total_amount
    FROM 
        gl_invoices
),

-- Total expenses
total_expenses AS (
    SELECT 
        COALESCE(SUM(amount), 0) AS total_amount
    FROM 
        gl_expenses
),

-- Cost of Goods Sold (approximation based on products sold)
cost_of_goods_sold AS (
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
),

-- Calculate gross profit
gross_profit AS (
    SELECT 
        (SELECT total_amount FROM total_sales) - 
        (SELECT total_amount FROM cost_of_goods_sold) AS total_amount
),

-- Calculate net income (simplified)
net_income AS (
    SELECT 
        (SELECT total_amount FROM gross_profit) - 
        (SELECT total_amount FROM total_expenses) AS total_amount
),

-- Current assets
current_assets AS (
    SELECT 
        (SELECT total_amount FROM accounts_receivable) + 
        (SELECT total_amount FROM customer_payments_in_transit) +
        (SELECT total_amount FROM inventory_value) AS total_amount
),

-- Current liabilities
current_liabilities AS (
    SELECT 
        (SELECT total_amount FROM accounts_payable) + 
        (SELECT total_amount FROM unpaid_purchase_orders) AS total_amount
),

-- Working capital
working_capital AS (
    SELECT 
        (SELECT total_amount FROM current_assets) - 
        (SELECT total_amount FROM current_liabilities) AS total_amount
)

-- Main balance sheet query
SELECT
    CURRENT_DATE AS balance_sheet_date,
    
    -- Assets
    (SELECT total_amount FROM accounts_receivable) AS accounts_receivable,
    (SELECT total_amount FROM customer_payments_in_transit) AS customer_payments_in_transit,
    (SELECT total_amount FROM inventory_value) AS inventory_value,
    (SELECT total_amount FROM current_assets) AS total_current_assets,
    
    -- No non-current assets in this schema
    0 AS property_and_equipment,
    0 AS intangible_assets,
    0 AS total_non_current_assets,
    
    -- Total Assets
    (SELECT total_amount FROM current_assets) AS total_assets,
    
    -- Liabilities
    (SELECT total_amount FROM accounts_payable) AS accounts_payable,
    (SELECT total_amount FROM unpaid_purchase_orders) AS unpaid_purchase_orders,
    (SELECT total_amount FROM current_liabilities) AS total_current_liabilities,
    
    -- No non-current liabilities in this schema
    0 AS long_term_debt,
    0 AS total_non_current_liabilities,
    
    -- Total Liabilities
    (SELECT total_amount FROM current_liabilities) AS total_liabilities,
    
    -- Equity
    (SELECT total_amount FROM net_income) AS retained_earnings,
    0 AS owner_contributions,
    0 AS owner_withdrawals,
    (SELECT total_amount FROM net_income) AS total_equity,
    
    -- Total Liabilities and Equity
    ((SELECT total_amount FROM current_liabilities) + (SELECT total_amount FROM net_income)) AS total_liabilities_and_equity,
    
    -- Financial Ratios
    CASE 
        WHEN (SELECT total_amount FROM current_liabilities) = 0 THEN NULL
        ELSE (SELECT total_amount FROM current_assets) / NULLIF((SELECT total_amount FROM current_liabilities), 0)
    END AS current_ratio,
    
    CASE 
        WHEN (SELECT total_amount FROM net_income) = 0 THEN NULL
        ELSE (SELECT total_amount FROM current_liabilities) / NULLIF((SELECT total_amount FROM net_income), 0)
    END AS debt_to_equity_ratio,
    
    CASE 
        WHEN (SELECT total_amount FROM current_assets) = 0 THEN NULL
        ELSE (SELECT total_amount FROM current_liabilities) / NULLIF((SELECT total_amount FROM current_assets), 0)
    END AS debt_ratio,
    
    (SELECT total_amount FROM working_capital) AS working_capital; 