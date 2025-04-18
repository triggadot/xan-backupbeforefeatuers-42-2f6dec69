/*
  Budget Variance Analysis
  
  Purpose: Compare actual financial results to budgeted figures
  Tables used: gl_budget_items, gl_expenses, gl_invoices, gl_revenue_categories
  
  This query analyzes variances between budgeted and actual amounts:
  - Revenue variances by category
  - Expense variances by category
  - Net income variance
  - Variance percentages and performance indicators
*/

-- Get monthly budget data
WITH monthly_budget AS (
  SELECT
    DATE_TRUNC('month', budget_date)::DATE AS month_start,
    category,
    category_type,
    SUM(amount) AS budgeted_amount
  FROM
    gl_budget_items
  WHERE
    budget_date BETWEEN '2023-01-01' AND '2023-12-31'
  GROUP BY
    month_start, category, category_type
),

-- Get monthly actual revenue
monthly_actual_revenue AS (
  SELECT
    DATE_TRUNC('month', i.invoice_date)::DATE AS month_start,
    rc.category_name AS category,
    'revenue' AS category_type,
    SUM(i.total_amount) AS actual_amount
  FROM
    gl_invoices i
    JOIN gl_revenue_categories rc ON i.category_id = rc.id
  WHERE
    i.invoice_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND i.status = 'issued'
  GROUP BY
    month_start, rc.category_name
),

-- Get monthly actual expenses
monthly_actual_expenses AS (
  SELECT
    DATE_TRUNC('month', e.expense_date)::DATE AS month_start,
    e.category,
    'expense' AS category_type,
    SUM(e.amount) AS actual_amount
  FROM
    gl_expenses e
  WHERE
    e.expense_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND e.status = 'paid'
  GROUP BY
    month_start, e.category
),

-- Combine all actual data
monthly_actual AS (
  SELECT * FROM monthly_actual_revenue
  UNION ALL
  SELECT * FROM monthly_actual_expenses
),

-- All months in the period
all_months AS (
  SELECT
    generate_series(
      '2023-01-01'::DATE,
      '2023-12-31'::DATE,
      '1 month'::INTERVAL
    )::DATE AS month_start
),

-- All categories from both budget and actual
all_categories AS (
  SELECT DISTINCT category, category_type
  FROM (
    SELECT category, category_type FROM monthly_budget
    UNION
    SELECT category, category_type FROM monthly_actual
  ) all_cats
),

-- Complete matrix of months and categories
month_category_matrix AS (
  SELECT
    am.month_start,
    ac.category,
    ac.category_type
  FROM
    all_months am
    CROSS JOIN all_categories ac
),

-- Budget vs actual comparison
budget_vs_actual AS (
  SELECT
    mcm.month_start,
    TO_CHAR(mcm.month_start, 'Month YYYY') AS month_name,
    mcm.category,
    mcm.category_type,
    COALESCE(mb.budgeted_amount, 0) AS budgeted_amount,
    COALESCE(ma.actual_amount, 0) AS actual_amount,
    COALESCE(ma.actual_amount, 0) - COALESCE(mb.budgeted_amount, 0) AS variance_amount,
    CASE
      WHEN COALESCE(mb.budgeted_amount, 0) = 0 THEN NULL
      ELSE ROUND((COALESCE(ma.actual_amount, 0) - COALESCE(mb.budgeted_amount, 0)) / 
           NULLIF(COALESCE(mb.budgeted_amount, 0), 0) * 100, 2)
    END AS variance_percentage,
    CASE
      WHEN mcm.category_type = 'revenue' AND COALESCE(ma.actual_amount, 0) >= COALESCE(mb.budgeted_amount, 0) THEN 'Favorable'
      WHEN mcm.category_type = 'expense' AND COALESCE(ma.actual_amount, 0) <= COALESCE(mb.budgeted_amount, 0) THEN 'Favorable'
      WHEN COALESCE(mb.budgeted_amount, 0) = 0 THEN 'No Budget'
      ELSE 'Unfavorable'
    END AS performance
  FROM
    month_category_matrix mcm
    LEFT JOIN monthly_budget mb ON mcm.month_start = mb.month_start 
                              AND mcm.category = mb.category 
                              AND mcm.category_type = mb.category_type
    LEFT JOIN monthly_actual ma ON mcm.month_start = ma.month_start 
                              AND mcm.category = ma.category 
                              AND mcm.category_type = ma.category_type
)

-- Main query for budget variance analysis
SELECT
  month_start,
  month_name,
  category,
  category_type,
  budgeted_amount,
  actual_amount,
  variance_amount,
  variance_percentage,
  performance
FROM
  budget_vs_actual
ORDER BY
  month_start,
  category_type,
  category;

/*
  -- Summary by month (all categories combined)
  SELECT
    month_start,
    month_name,
    category_type,
    SUM(budgeted_amount) AS total_budgeted,
    SUM(actual_amount) AS total_actual,
    SUM(variance_amount) AS total_variance,
    CASE
      WHEN SUM(budgeted_amount) = 0 THEN NULL
      ELSE ROUND(SUM(variance_amount) / NULLIF(SUM(budgeted_amount), 0) * 100, 2)
    END AS variance_percentage,
    CASE
      WHEN category_type = 'revenue' AND SUM(actual_amount) >= SUM(budgeted_amount) THEN 'Favorable'
      WHEN category_type = 'expense' AND SUM(actual_amount) <= SUM(budgeted_amount) THEN 'Favorable'
      ELSE 'Unfavorable'
    END AS performance
  FROM
    budget_vs_actual
  GROUP BY
    month_start, month_name, category_type
  ORDER BY
    month_start, category_type;
*/

/*
  -- Net income variance analysis
  WITH revenue_summary AS (
    SELECT
      month_start,
      SUM(budgeted_amount) AS budgeted_revenue,
      SUM(actual_amount) AS actual_revenue
    FROM
      budget_vs_actual
    WHERE
      category_type = 'revenue'
    GROUP BY
      month_start
  ),
  
  expense_summary AS (
    SELECT
      month_start,
      SUM(budgeted_amount) AS budgeted_expenses,
      SUM(actual_amount) AS actual_expenses
    FROM
      budget_vs_actual
    WHERE
      category_type = 'expense'
    GROUP BY
      month_start
  )
  
  SELECT
    rs.month_start,
    TO_CHAR(rs.month_start, 'Month YYYY') AS month_name,
    rs.budgeted_revenue,
    rs.actual_revenue,
    es.budgeted_expenses,
    es.actual_expenses,
    rs.budgeted_revenue - es.budgeted_expenses AS budgeted_net_income,
    rs.actual_revenue - es.actual_expenses AS actual_net_income,
    (rs.actual_revenue - es.actual_expenses) - (rs.budgeted_revenue - es.budgeted_expenses) AS net_income_variance,
    CASE
      WHEN (rs.budgeted_revenue - es.budgeted_expenses) = 0 THEN NULL
      ELSE ROUND(
        ((rs.actual_revenue - es.actual_expenses) - (rs.budgeted_revenue - es.budgeted_expenses)) / 
        NULLIF((rs.budgeted_revenue - es.budgeted_expenses), 0) * 100, 
        2
      )
    END AS net_income_variance_percentage,
    CASE
      WHEN (rs.actual_revenue - es.actual_expenses) >= (rs.budgeted_revenue - es.budgeted_expenses) THEN 'Favorable'
      ELSE 'Unfavorable'
    END AS performance
  FROM
    revenue_summary rs
    JOIN expense_summary es ON rs.month_start = es.month_start
  ORDER BY
    rs.month_start;
*/

/*
  Example Usage:
  
  - The main query shows detailed variances by month and category
  - Uncomment the summary queries for high-level analysis
  - Adjust the date range in the CTEs to analyze different periods
  
  For year-to-date analysis:
  
  WITH ytd_budget AS (
    SELECT
      category,
      category_type,
      SUM(amount) AS budgeted_amount
    FROM
      gl_budget_items
    WHERE
      budget_date BETWEEN '2023-01-01' AND CURRENT_DATE
    GROUP BY
      category, category_type
  ),
  
  ytd_actual_revenue AS (
    SELECT
      rc.category_name AS category,
      'revenue' AS category_type,
      SUM(i.total_amount) AS actual_amount
    FROM
      gl_invoices i
      JOIN gl_revenue_categories rc ON i.category_id = rc.id
    WHERE
      i.invoice_date BETWEEN '2023-01-01' AND CURRENT_DATE
      AND i.status = 'issued'
    GROUP BY
      rc.category_name
  ),
  
  -- Similar CTEs for expenses and calculations
*/ 