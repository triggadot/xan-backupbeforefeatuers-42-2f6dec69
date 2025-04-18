/*
  Cash Flow Statement
  
  Purpose: Generate a cash flow statement for a specific period
  Tables used: gl_transactions, gl_accounts, gl_cash_flow_items
  
  This query produces a cash flow statement with:
  - Operating activities
  - Investing activities
  - Financing activities
  - Net change in cash
*/

-- Cash at beginning and end of period
WITH cash_balances AS (
  SELECT
    COALESCE(SUM(CASE 
      WHEN t.transaction_date < '2023-01-01' THEN
        CASE WHEN t.transaction_type = 'debit' THEN t.amount ELSE -t.amount END
      ELSE 0
    END), 0) AS beginning_cash,
    
    COALESCE(SUM(CASE 
      WHEN t.transaction_date <= '2023-12-31' THEN
        CASE WHEN t.transaction_type = 'debit' THEN t.amount ELSE -t.amount END
      ELSE 0
    END), 0) AS ending_cash
  FROM
    gl_transactions t
    JOIN gl_accounts a ON t.account_id = a.id
  WHERE
    a.account_type = 'cash'
),

-- Operating activities
operating_cash_flow AS (
  SELECT
    cfi.category,
    cfi.subcategory,
    cfi.description,
    SUM(CASE WHEN t.transaction_type = 'debit' THEN t.amount ELSE -t.amount END) AS amount
  FROM
    gl_transactions t
    JOIN gl_accounts a ON t.account_id = a.id
    JOIN gl_cash_flow_items cfi ON a.id = cfi.account_id
  WHERE
    t.transaction_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND cfi.category = 'operating'
  GROUP BY
    cfi.category, cfi.subcategory, cfi.description
),

-- Investing activities
investing_cash_flow AS (
  SELECT
    cfi.category,
    cfi.subcategory,
    cfi.description,
    SUM(CASE WHEN t.transaction_type = 'debit' THEN t.amount ELSE -t.amount END) AS amount
  FROM
    gl_transactions t
    JOIN gl_accounts a ON t.account_id = a.id
    JOIN gl_cash_flow_items cfi ON a.id = cfi.account_id
  WHERE
    t.transaction_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND cfi.category = 'investing'
  GROUP BY
    cfi.category, cfi.subcategory, cfi.description
),

-- Financing activities
financing_cash_flow AS (
  SELECT
    cfi.category,
    cfi.subcategory,
    cfi.description,
    SUM(CASE WHEN t.transaction_type = 'debit' THEN t.amount ELSE -t.amount END) AS amount
  FROM
    gl_transactions t
    JOIN gl_accounts a ON t.account_id = a.id
    JOIN gl_cash_flow_items cfi ON a.id = cfi.account_id
  WHERE
    t.transaction_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND cfi.category = 'financing'
  GROUP BY
    cfi.category, cfi.subcategory, cfi.description
),

-- Total cash flows by category
cash_flow_totals AS (
  SELECT
    'operating' AS category,
    COALESCE(SUM(amount), 0) AS total_amount
  FROM
    operating_cash_flow
  
  UNION ALL
  
  SELECT
    'investing' AS category,
    COALESCE(SUM(amount), 0) AS total_amount
  FROM
    investing_cash_flow
  
  UNION ALL
  
  SELECT
    'financing' AS category,
    COALESCE(SUM(amount), 0) AS total_amount
  FROM
    financing_cash_flow
)

-- Main Cash Flow Statement
SELECT
  '2023-01-01'::DATE AS period_start,
  '2023-12-31'::DATE AS period_end,
  cb.beginning_cash,
  
  -- Net cash flow from operating activities
  (SELECT total_amount FROM cash_flow_totals WHERE category = 'operating') AS net_operating_cash_flow,
  
  -- Net cash flow from investing activities
  (SELECT total_amount FROM cash_flow_totals WHERE category = 'investing') AS net_investing_cash_flow,
  
  -- Net cash flow from financing activities
  (SELECT total_amount FROM cash_flow_totals WHERE category = 'financing') AS net_financing_cash_flow,
  
  -- Net change in cash
  (SELECT SUM(total_amount) FROM cash_flow_totals) AS net_change_in_cash,
  
  cb.ending_cash,
  
  -- Verify the change in cash equals ending minus beginning
  cb.ending_cash - cb.beginning_cash AS calculated_change,
  
  -- Free cash flow (simplified)
  (SELECT total_amount FROM cash_flow_totals WHERE category = 'operating') - 
  COALESCE((SELECT SUM(amount) FROM investing_cash_flow WHERE subcategory = 'capital_expenditure'), 0) AS free_cash_flow
FROM
  cash_balances cb;

/*
  -- Detailed Operating Cash Flow
  SELECT
    description,
    amount
  FROM
    operating_cash_flow
  ORDER BY
    amount DESC;
  
  -- Detailed Investing Cash Flow
  SELECT
    description,
    amount
  FROM
    investing_cash_flow
  ORDER BY
    amount DESC;
  
  -- Detailed Financing Cash Flow
  SELECT
    description,
    amount
  FROM
    financing_cash_flow
  ORDER BY
    amount DESC;
*/

/*
  Example Usage:
  
  - The main query provides a summarized cash flow statement for the specified period
  - Uncomment the detailed breakdown queries for more granular analysis
  - Adjust the date range in the CTEs to generate the cash flow statement for different periods
  
  For quarterly analysis, you can use:
  
  WITH quarters AS (
    SELECT
      date_trunc('quarter', date '2023-01-01') + (n * interval '3 months') AS quarter_start,
      date_trunc('quarter', date '2023-01-01') + (n * interval '3 months') + interval '3 months' - interval '1 day' AS quarter_end
    FROM generate_series(0, 3) AS n
  )
  
  -- Then use each quarter's start and end dates in subqueries
*/ 