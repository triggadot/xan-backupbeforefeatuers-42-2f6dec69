/*
  Balance Sheet
  
  Purpose: Generate a balance sheet for a specific point in time
  Tables used: gl_accounts, gl_transactions, gl_assets, gl_liabilities
  
  This query produces a balance sheet with:
  - Assets (current and non-current)
  - Liabilities (current and non-current)
  - Equity calculation
  - Key financial ratios
*/

-- Assets
WITH assets AS (
  SELECT
    a.account_type,
    a.is_current,
    SUM(a.value) AS asset_value
  FROM
    gl_assets a
  WHERE
    a.as_of_date <= '2023-12-31'
    AND (a.end_date IS NULL OR a.end_date > '2023-12-31')
  GROUP BY
    a.account_type, a.is_current
),

-- Liabilities
liabilities AS (
  SELECT
    l.account_type,
    l.is_current,
    SUM(l.value) AS liability_value
  FROM
    gl_liabilities l
  WHERE
    l.as_of_date <= '2023-12-31'
    AND (l.end_date IS NULL OR l.end_date > '2023-12-31')
  GROUP BY
    l.account_type, l.is_current
),

-- Account Balances
account_balances AS (
  SELECT
    act.id,
    act.name,
    act.account_type,
    act.is_current,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'debit' THEN t.amount ELSE -t.amount END), 0) AS balance
  FROM
    gl_accounts act
    LEFT JOIN gl_transactions t ON act.id = t.account_id
  WHERE
    t.transaction_date <= '2023-12-31'
  GROUP BY
    act.id, act.name, act.account_type, act.is_current
),

-- Total Assets and Liabilities
total_assets AS (
  SELECT
    SUM(CASE WHEN is_current THEN asset_value ELSE 0 END) AS current_assets,
    SUM(CASE WHEN NOT is_current THEN asset_value ELSE 0 END) AS non_current_assets,
    SUM(asset_value) AS total_assets
  FROM
    assets
),

total_liabilities AS (
  SELECT
    SUM(CASE WHEN is_current THEN liability_value ELSE 0 END) AS current_liabilities,
    SUM(CASE WHEN NOT is_current THEN liability_value ELSE 0 END) AS non_current_liabilities,
    SUM(liability_value) AS total_liabilities
  FROM
    liabilities
),

-- Retained Earnings (simplified calculation)
retained_earnings AS (
  SELECT
    COALESCE(SUM(balance), 0) AS retained_earnings_value
  FROM
    account_balances
  WHERE
    account_type = 'retained_earnings'
)

-- Main Balance Sheet Query
SELECT
  '2023-12-31'::DATE AS balance_sheet_date,
  
  -- Assets Section
  ta.current_assets,
  ta.non_current_assets,
  ta.total_assets,
  
  -- Liabilities Section
  tl.current_liabilities,
  tl.non_current_liabilities,
  tl.total_liabilities,
  
  -- Equity Section
  re.retained_earnings_value,
  ta.total_assets - tl.total_liabilities AS total_equity,
  
  -- Key Ratios
  CASE
    WHEN tl.current_liabilities > 0 
    THEN ROUND(ta.current_assets / tl.current_liabilities, 2)
    ELSE NULL
  END AS current_ratio,
  
  CASE
    WHEN tl.total_liabilities > 0 
    THEN ROUND(tl.total_liabilities / (ta.total_assets - tl.total_liabilities), 2)
    ELSE NULL
  END AS debt_to_equity_ratio,
  
  CASE
    WHEN ta.total_assets > 0 
    THEN ROUND(tl.total_liabilities / ta.total_assets, 2)
    ELSE NULL
  END AS debt_ratio
FROM
  total_assets ta,
  total_liabilities tl,
  retained_earnings re;

/*
  -- Detailed Asset Breakdown
  SELECT
    'Assets' AS section,
    ab.name AS account_name,
    ab.account_type,
    CASE WHEN ab.is_current THEN 'Current' ELSE 'Non-current' END AS classification,
    ab.balance
  FROM
    account_balances ab
  WHERE
    ab.account_type LIKE 'asset%'
  ORDER BY
    ab.is_current DESC, ab.account_type, ab.name;
*/

/*
  -- Detailed Liability Breakdown
  SELECT
    'Liabilities' AS section,
    ab.name AS account_name,
    ab.account_type,
    CASE WHEN ab.is_current THEN 'Current' ELSE 'Non-current' END AS classification,
    ab.balance
  FROM
    account_balances ab
  WHERE
    ab.account_type LIKE 'liability%'
  ORDER BY
    ab.is_current DESC, ab.account_type, ab.name;
*/

/*
  Example Usage:
  
  - The main query provides a summarized balance sheet as of the specified date
  - Uncomment the detailed breakdown queries for more granular analysis
  - Adjust the date in the CTEs to generate the balance sheet for different dates
  
  For monthly comparison:
  
  WITH monthly_dates AS (
    SELECT
      generate_series(
        '2023-01-01'::DATE,
        '2023-12-01'::DATE,
        '1 month'::INTERVAL
      )::DATE + INTERVAL '1 month - 1 day' AS month_end
  )
  
  -- Then use each month_end date in subqueries to generate monthly balance sheets
*/ 