/*
  Financial Ratios Analysis
  
  Purpose: Calculate key financial ratios to evaluate business performance
  Tables used: gl_accounts, gl_transactions, gl_assets, gl_liabilities, gl_invoices, gl_expenses
  
  This query calculates important financial ratios across categories:
  - Liquidity ratios
  - Profitability ratios
  - Efficiency ratios
  - Solvency ratios
  - Valuation ratios
*/

-- Common table expressions for financial statement data
WITH balance_sheet_data AS (
  -- Assets
  SELECT
    'assets' AS category,
    'current_assets' AS subcategory,
    SUM(CASE WHEN a.is_current THEN a.value ELSE 0 END) AS amount
  FROM
    gl_assets a
  WHERE
    a.as_of_date <= '2023-12-31'
    AND (a.end_date IS NULL OR a.end_date > '2023-12-31')
  
  UNION ALL
  
  SELECT
    'assets' AS category,
    'total_assets' AS subcategory,
    SUM(a.value) AS amount
  FROM
    gl_assets a
  WHERE
    a.as_of_date <= '2023-12-31'
    AND (a.end_date IS NULL OR a.end_date > '2023-12-31')
  
  UNION ALL
  
  -- Cash
  SELECT
    'assets' AS category,
    'cash_and_equivalents' AS subcategory,
    SUM(CASE 
      WHEN a.account_type = 'cash' OR a.account_type = 'cash_equivalent'
      THEN a.value ELSE 0 END) AS amount
  FROM
    gl_assets a
  WHERE
    a.as_of_date <= '2023-12-31'
    AND (a.end_date IS NULL OR a.end_date > '2023-12-31')
  
  UNION ALL
  
  -- Accounts Receivable
  SELECT
    'assets' AS category,
    'accounts_receivable' AS subcategory,
    SUM(CASE 
      WHEN a.account_type = 'accounts_receivable'
      THEN a.value ELSE 0 END) AS amount
  FROM
    gl_assets a
  WHERE
    a.as_of_date <= '2023-12-31'
    AND (a.end_date IS NULL OR a.end_date > '2023-12-31')
  
  UNION ALL
  
  -- Inventory
  SELECT
    'assets' AS category,
    'inventory' AS subcategory,
    SUM(CASE 
      WHEN a.account_type = 'inventory'
      THEN a.value ELSE 0 END) AS amount
  FROM
    gl_assets a
  WHERE
    a.as_of_date <= '2023-12-31'
    AND (a.end_date IS NULL OR a.end_date > '2023-12-31')
  
  UNION ALL
  
  -- Liabilities
  SELECT
    'liabilities' AS category,
    'current_liabilities' AS subcategory,
    SUM(CASE WHEN l.is_current THEN l.value ELSE 0 END) AS amount
  FROM
    gl_liabilities l
  WHERE
    l.as_of_date <= '2023-12-31'
    AND (l.end_date IS NULL OR l.end_date > '2023-12-31')
  
  UNION ALL
  
  SELECT
    'liabilities' AS category,
    'total_liabilities' AS subcategory,
    SUM(l.value) AS amount
  FROM
    gl_liabilities l
  WHERE
    l.as_of_date <= '2023-12-31'
    AND (l.end_date IS NULL OR l.end_date > '2023-12-31')
  
  UNION ALL
  
  -- Accounts Payable
  SELECT
    'liabilities' AS category,
    'accounts_payable' AS subcategory,
    SUM(CASE 
      WHEN l.account_type = 'accounts_payable'
      THEN l.value ELSE 0 END) AS amount
  FROM
    gl_liabilities l
  WHERE
    l.as_of_date <= '2023-12-31'
    AND (l.end_date IS NULL OR l.end_date > '2023-12-31')
  
  UNION ALL
  
  -- Long-term debt
  SELECT
    'liabilities' AS category,
    'long_term_debt' AS subcategory,
    SUM(CASE 
      WHEN l.account_type = 'loan' AND NOT l.is_current
      THEN l.value ELSE 0 END) AS amount
  FROM
    gl_liabilities l
  WHERE
    l.as_of_date <= '2023-12-31'
    AND (l.end_date IS NULL OR l.end_date > '2023-12-31')
),

income_statement_data AS (
  -- Revenue
  SELECT
    'income' AS category,
    'revenue' AS subcategory,
    SUM(i.total_amount) AS amount
  FROM
    gl_invoices i
  WHERE
    i.invoice_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND i.status = 'issued'
  
  UNION ALL
  
  -- Cost of Goods Sold
  SELECT
    'income' AS category,
    'cogs' AS subcategory,
    SUM(e.amount) AS amount
  FROM
    gl_expenses e
  WHERE
    e.expense_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND e.category = 'cost_of_goods_sold'
  
  UNION ALL
  
  -- Total Expenses
  SELECT
    'income' AS category,
    'total_expenses' AS subcategory,
    SUM(e.amount) AS amount
  FROM
    gl_expenses e
  WHERE
    e.expense_date BETWEEN '2023-01-01' AND '2023-12-31'
  
  UNION ALL
  
  -- Operating Expenses
  SELECT
    'income' AS category,
    'operating_expenses' AS subcategory,
    SUM(e.amount) AS amount
  FROM
    gl_expenses e
  WHERE
    e.expense_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND e.category != 'cost_of_goods_sold'
    AND e.category != 'interest'
    AND e.category != 'taxes'
  
  UNION ALL
  
  -- Interest Expense
  SELECT
    'income' AS category,
    'interest_expense' AS subcategory,
    SUM(e.amount) AS amount
  FROM
    gl_expenses e
  WHERE
    e.expense_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND e.category = 'interest'
),

sales_data AS (
  -- Total sales
  SELECT
    COUNT(i.id) AS invoice_count,
    SUM(i.total_amount) AS total_sales
  FROM
    gl_invoices i
  WHERE
    i.invoice_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND i.status = 'issued'
),

inventory_data AS (
  -- Average inventory
  SELECT
    AVG(a.value) AS avg_inventory
  FROM
    gl_assets a
  WHERE
    a.account_type = 'inventory'
    AND a.as_of_date BETWEEN '2023-01-01' AND '2023-12-31'
),

derived_metrics AS (
  SELECT
    (SELECT amount FROM income_statement_data WHERE subcategory = 'revenue') -
    (SELECT amount FROM income_statement_data WHERE subcategory = 'cogs') AS gross_profit,
    
    (SELECT amount FROM income_statement_data WHERE subcategory = 'revenue') -
    (SELECT amount FROM income_statement_data WHERE subcategory = 'operating_expenses') -
    (SELECT amount FROM income_statement_data WHERE subcategory = 'cogs') AS operating_profit,
    
    (SELECT amount FROM income_statement_data WHERE subcategory = 'revenue') -
    (SELECT amount FROM income_statement_data WHERE subcategory = 'total_expenses') AS net_profit,
    
    (SELECT amount FROM balance_sheet_data WHERE subcategory = 'total_assets') -
    (SELECT amount FROM balance_sheet_data WHERE subcategory = 'total_liabilities') AS total_equity
)

-- Main ratio calculations
SELECT
  '2023-01-01'::DATE AS period_start,
  '2023-12-31'::DATE AS period_end,
  
  -- Liquidity Ratios
  ROUND(
    (SELECT amount FROM balance_sheet_data WHERE subcategory = 'current_assets') /
    NULLIF((SELECT amount FROM balance_sheet_data WHERE subcategory = 'current_liabilities'), 0),
    2
  ) AS current_ratio,
  
  ROUND(
    ((SELECT amount FROM balance_sheet_data WHERE subcategory = 'current_assets') -
     (SELECT amount FROM balance_sheet_data WHERE subcategory = 'inventory')) /
    NULLIF((SELECT amount FROM balance_sheet_data WHERE subcategory = 'current_liabilities'), 0),
    2
  ) AS quick_ratio,
  
  ROUND(
    (SELECT amount FROM balance_sheet_data WHERE subcategory = 'cash_and_equivalents') /
    NULLIF((SELECT amount FROM balance_sheet_data WHERE subcategory = 'current_liabilities'), 0),
    2
  ) AS cash_ratio,
  
  -- Profitability Ratios
  ROUND(
    (SELECT gross_profit FROM derived_metrics) /
    NULLIF((SELECT amount FROM income_statement_data WHERE subcategory = 'revenue'), 0) * 100,
    2
  ) AS gross_profit_margin,
  
  ROUND(
    (SELECT operating_profit FROM derived_metrics) /
    NULLIF((SELECT amount FROM income_statement_data WHERE subcategory = 'revenue'), 0) * 100,
    2
  ) AS operating_margin,
  
  ROUND(
    (SELECT net_profit FROM derived_metrics) /
    NULLIF((SELECT amount FROM income_statement_data WHERE subcategory = 'revenue'), 0) * 100,
    2
  ) AS net_profit_margin,
  
  ROUND(
    (SELECT net_profit FROM derived_metrics) /
    NULLIF((SELECT amount FROM balance_sheet_data WHERE subcategory = 'total_assets'), 0) * 100,
    2
  ) AS return_on_assets,
  
  ROUND(
    (SELECT net_profit FROM derived_metrics) /
    NULLIF((SELECT total_equity FROM derived_metrics), 0) * 100,
    2
  ) AS return_on_equity,
  
  -- Efficiency Ratios
  ROUND(
    (SELECT amount FROM income_statement_data WHERE subcategory = 'revenue') /
    NULLIF((SELECT amount FROM balance_sheet_data WHERE subcategory = 'total_assets'), 0),
    2
  ) AS asset_turnover,
  
  ROUND(
    (SELECT amount FROM income_statement_data WHERE subcategory = 'cogs') /
    NULLIF((SELECT avg_inventory FROM inventory_data), 0),
    2
  ) AS inventory_turnover,
  
  ROUND(
    365 /
    NULLIF((SELECT amount FROM income_statement_data WHERE subcategory = 'cogs') /
    NULLIF((SELECT avg_inventory FROM inventory_data), 0), 0),
    0
  ) AS days_inventory_outstanding,
  
  ROUND(
    (SELECT amount FROM income_statement_data WHERE subcategory = 'revenue') /
    NULLIF((SELECT amount FROM balance_sheet_data WHERE subcategory = 'accounts_receivable'), 0),
    2
  ) AS receivables_turnover,
  
  ROUND(
    365 /
    NULLIF((SELECT amount FROM income_statement_data WHERE subcategory = 'revenue') /
    NULLIF((SELECT amount FROM balance_sheet_data WHERE subcategory = 'accounts_receivable'), 0), 0),
    0
  ) AS days_sales_outstanding,
  
  -- Solvency Ratios
  ROUND(
    (SELECT amount FROM balance_sheet_data WHERE subcategory = 'total_liabilities') /
    NULLIF((SELECT total_equity FROM derived_metrics), 0),
    2
  ) AS debt_to_equity,
  
  ROUND(
    (SELECT amount FROM balance_sheet_data WHERE subcategory = 'total_liabilities') /
    NULLIF((SELECT amount FROM balance_sheet_data WHERE subcategory = 'total_assets'), 0) * 100,
    2
  ) AS debt_ratio,
  
  ROUND(
    (SELECT operating_profit FROM derived_metrics) /
    NULLIF((SELECT amount FROM income_statement_data WHERE subcategory = 'interest_expense'), 0),
    2
  ) AS interest_coverage_ratio,
  
  -- Operational Metrics
  ROUND(
    (SELECT operating_profit FROM derived_metrics) / 
    (SELECT invoice_count FROM sales_data),
    2
  ) AS profit_per_sale,
  
  ROUND(
    (SELECT total_sales FROM sales_data) /
    (SELECT invoice_count FROM sales_data),
    2
  ) AS average_sale_value;

/*
  Example Usage:
  
  - Adjust the date range in the CTEs to analyze different periods
  - Focus on specific ratio categories by commenting out others
  - Compare ratios across different time periods to identify trends
  
  Example for quarterly analysis:
  
  To generate quarterly ratios, modify the date ranges in each CTE:
  
  WHERE 
    a.as_of_date <= '2023-03-31'  -- For Q1
    -- a.as_of_date <= '2023-06-30'  -- For Q2
    -- a.as_of_date <= '2023-09-30'  -- For Q3
    -- a.as_of_date <= '2023-12-31'  -- For Q4
  
  And for the income statement data:
  
  WHERE
    i.invoice_date BETWEEN '2023-01-01' AND '2023-03-31'  -- For Q1
    -- i.invoice_date BETWEEN '2023-04-01' AND '2023-06-30'  -- For Q2
    -- i.invoice_date BETWEEN '2023-07-01' AND '2023-09-30'  -- For Q3
    -- i.invoice_date BETWEEN '2023-10-01' AND '2023-12-31'  -- For Q4
*/ 