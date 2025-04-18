-- Cash Flow Statement View
-- This view generates a cash flow statement showing operating, investing, and financing activities
-- It covers a one-year period ending on the current date

CREATE OR REPLACE VIEW cash_flow_statement_view AS
WITH 
-- Time periods
date_ranges AS (
    SELECT
        CURRENT_DATE - INTERVAL '1 year' AS start_date,
        CURRENT_DATE AS end_date
),

-- Operating Activities
-- Customer payments received (cash inflow)
customer_payments AS (
    SELECT 
        COALESCE(SUM(payment_amount), 0) AS total_amount
    FROM 
        gl_customer_payments
    WHERE 
        date_of_payment BETWEEN (SELECT start_date FROM date_ranges) AND (SELECT end_date FROM date_ranges)
),

-- Vendor payments made (cash outflow)
vendor_payments AS (
    SELECT 
        COALESCE(SUM(payment_amount), 0) AS total_amount
    FROM 
        gl_vendor_payments
    WHERE 
        date_of_payment BETWEEN (SELECT start_date FROM date_ranges) AND (SELECT end_date FROM date_ranges)
),

-- Expenses paid (cash outflow)
expenses_paid AS (
    SELECT 
        COALESCE(SUM(amount), 0) AS total_amount
    FROM 
        gl_expenses
    WHERE 
        date BETWEEN (SELECT start_date FROM date_ranges) AND (SELECT end_date FROM date_ranges)
),

-- Changes in accounts receivable (non-cash adjustment)
change_in_accounts_receivable AS (
    SELECT 
        (
            (
                SELECT COALESCE(SUM(customer_balance), 0)
                FROM gl_accounts
                WHERE updated_at <= (SELECT end_date FROM date_ranges)
            ) - 
            (
                SELECT COALESCE(SUM(customer_balance), 0)
                FROM gl_accounts
                WHERE updated_at <= (SELECT start_date FROM date_ranges)
            )
        ) AS total_amount
),

-- Changes in accounts payable (non-cash adjustment)
change_in_accounts_payable AS (
    SELECT 
        (
            (
                SELECT COALESCE(SUM(ABS(vendor_balance)), 0)
                FROM gl_accounts
                WHERE updated_at <= (SELECT end_date FROM date_ranges) AND vendor_balance < 0
            ) - 
            (
                SELECT COALESCE(SUM(ABS(vendor_balance)), 0)
                FROM gl_accounts
                WHERE updated_at <= (SELECT start_date FROM date_ranges) AND vendor_balance < 0
            )
        ) AS total_amount
),

-- Changes in inventory (non-cash adjustment)
change_in_inventory AS (
    SELECT 
        (
            (
                SELECT COALESCE(SUM(
                    CASE 
                        WHEN samples = true OR fronted = true THEN 0
                        ELSE (total_cost)
                    END
                ), 0)
                FROM gl_products
                WHERE updated_at <= (SELECT end_date FROM date_ranges)
            ) - 
            (
                SELECT COALESCE(SUM(
                    CASE 
                        WHEN samples = true OR fronted = true THEN 0
                        ELSE (total_cost)
                    END
                ), 0)
                FROM gl_products
                WHERE updated_at <= (SELECT start_date FROM date_ranges)
            )
        ) AS total_amount
),

-- Net cash from operating activities
net_cash_from_operating AS (
    SELECT 
        (SELECT total_amount FROM customer_payments) - 
        (SELECT total_amount FROM vendor_payments) -
        (SELECT total_amount FROM expenses_paid) -
        (SELECT total_amount FROM change_in_accounts_receivable) +
        (SELECT total_amount FROM change_in_accounts_payable) -
        (SELECT total_amount FROM change_in_inventory) AS total_amount
),

-- Investing Activities (not much data available, so using placeholders)
investing_activities AS (
    SELECT 0 AS total_amount
),

-- Financing Activities (not much data available, so using placeholders)
financing_activities AS (
    SELECT 0 AS total_amount
),

-- Net change in cash
net_change_in_cash AS (
    SELECT 
        (SELECT total_amount FROM net_cash_from_operating) +
        (SELECT total_amount FROM investing_activities) +
        (SELECT total_amount FROM financing_activities) AS total_amount
)

-- Main cash flow statement query
SELECT
    (SELECT start_date FROM date_ranges) AS start_date,
    (SELECT end_date FROM date_ranges) AS end_date,
    
    -- Operating Activities
    (SELECT total_amount FROM customer_payments) AS customer_payments_received,
    (SELECT total_amount FROM vendor_payments) * -1 AS vendor_payments_made,
    (SELECT total_amount FROM expenses_paid) * -1 AS expenses_paid,
    (SELECT total_amount FROM change_in_accounts_receivable) * -1 AS change_in_accounts_receivable,
    (SELECT total_amount FROM change_in_accounts_payable) AS change_in_accounts_payable,
    (SELECT total_amount FROM change_in_inventory) * -1 AS change_in_inventory,
    (SELECT total_amount FROM net_cash_from_operating) AS net_cash_from_operating_activities,
    
    -- Investing Activities (placeholder)
    0 AS purchase_of_equipment,
    0 AS sale_of_investments,
    (SELECT total_amount FROM investing_activities) AS net_cash_from_investing_activities,
    
    -- Financing Activities (placeholder)
    0 AS loan_proceeds,
    0 AS loan_repayments,
    0 AS owner_contributions,
    0 AS owner_withdrawals,
    (SELECT total_amount FROM financing_activities) AS net_cash_from_financing_activities,
    
    -- Net change in cash
    (SELECT total_amount FROM net_change_in_cash) AS net_change_in_cash,
    
    -- Beginning and ending cash balance (placeholders since we don't have this data)
    0 AS beginning_cash_balance,
    (SELECT total_amount FROM net_change_in_cash) AS ending_cash_balance; 