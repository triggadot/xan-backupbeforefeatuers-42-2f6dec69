/*
  Profit and Loss Statement
  
  Purpose: Generate a profit and loss statement for any date range
  Tables used: gl_invoices, gl_expenses, gl_revenue_categories, gl_expense_categories
  
  This query produces a P&L statement with:
  - Revenue broken down by categories
  - Expenses broken down by categories
  - Gross profit calculation
  - Net profit calculation
  - Profit margins analysis
*/

-- Revenue Analysis
WITH revenue_data AS (
  SELECT
    DATE_TRUNC('month', invoice_date)::DATE AS month_start,
    rc.category_name,
    SUM(i.total_amount) AS revenue_amount
  FROM
    gl_invoices i
    JOIN gl_revenue_categories rc ON i.category_id = rc.id
  WHERE
    i.status = 'issued'
    AND invoice_date BETWEEN '2023-01-01' AND '2023-12-31'
  GROUP BY
    month_start, rc.category_name
),

-- Expense Analysis
expense_data AS (
  SELECT
    DATE_TRUNC('month', payment_date)::DATE AS month_start,
    ec.category_name,
    SUM(e.amount) AS expense_amount
  FROM
    gl_expenses e
    JOIN gl_expense_categories ec ON e.category_id = ec.id
  WHERE
    e.status = 'paid'
    AND payment_date BETWEEN '2023-01-01' AND '2023-12-31'
  GROUP BY
    month_start, ec.category_name
),

-- Monthly Totals
monthly_totals AS (
  SELECT
    month_start,
    SUM(revenue_amount) AS total_revenue
  FROM
    revenue_data
  GROUP BY
    month_start
),

monthly_expenses AS (
  SELECT
    month_start,
    SUM(expense_amount) AS total_expenses
  FROM
    expense_data
  GROUP BY
    month_start
),

-- Complete Month Range
all_months AS (
  SELECT
    generate_series(
      '2023-01-01'::DATE,
      '2023-12-31'::DATE,
      '1 month'::INTERVAL
    )::DATE AS month_start
)

-- Main P&L Query
SELECT
  am.month_start,
  TO_CHAR(am.month_start, 'Month YYYY') AS month_name,
  COALESCE(mt.total_revenue, 0) AS total_revenue,
  COALESCE(me.total_expenses, 0) AS total_expenses,
  COALESCE(mt.total_revenue, 0) - COALESCE(me.total_expenses, 0) AS net_profit,
  CASE
    WHEN COALESCE(mt.total_revenue, 0) > 0 
    THEN ROUND(
      (COALESCE(mt.total_revenue, 0) - COALESCE(me.total_expenses, 0)) / 
      COALESCE(mt.total_revenue, 0) * 100, 
      2
    )
    ELSE 0
  END AS profit_margin_percentage
FROM
  all_months am
  LEFT JOIN monthly_totals mt ON am.month_start = mt.month_start
  LEFT JOIN monthly_expenses me ON am.month_start = me.month_start
ORDER BY
  am.month_start;

/*
  -- Revenue Breakdown by Category
  SELECT
    rd.category_name,
    SUM(rd.revenue_amount) AS total_amount,
    ROUND(
      SUM(rd.revenue_amount) * 100.0 / (
        SELECT SUM(revenue_amount) FROM revenue_data
      ), 
      2
    ) AS percentage_of_total
  FROM
    revenue_data rd
  GROUP BY
    rd.category_name
  ORDER BY
    total_amount DESC;
*/

/*
  -- Expense Breakdown by Category
  SELECT
    ed.category_name,
    SUM(ed.expense_amount) AS total_amount,
    ROUND(
      SUM(ed.expense_amount) * 100.0 / (
        SELECT SUM(expense_amount) FROM expense_data
      ), 
      2
    ) AS percentage_of_total
  FROM
    expense_data ed
  GROUP BY
    ed.category_name
  ORDER BY
    total_amount DESC;
*/

/*
  Example Usage:
  
  - The main query provides a monthly P&L statement
  - Uncomment the category breakdown queries for more detailed analysis
  - Adjust the date range in the CTEs to analyze different periods
  
  Example for quarterly P&L:
  
  SELECT
    DATE_TRUNC('quarter', month_start)::DATE AS quarter_start,
    TO_CHAR(DATE_TRUNC('quarter', month_start)::DATE, 'YYYY "Q"Q') AS quarter_name,
    SUM(total_revenue) AS quarterly_revenue,
    SUM(total_expenses) AS quarterly_expenses,
    SUM(net_profit) AS quarterly_profit,
    CASE
      WHEN SUM(total_revenue) > 0 
      THEN ROUND(SUM(net_profit) / SUM(total_revenue) * 100, 2)
      ELSE 0
    END AS quarterly_profit_margin
  FROM
    (
      -- Insert the main query here
    ) monthly_data
  GROUP BY
    quarter_start, quarter_name
  ORDER BY
    quarter_start;
*/ 