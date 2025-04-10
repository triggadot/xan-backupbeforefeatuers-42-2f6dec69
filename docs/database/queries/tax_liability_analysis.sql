/*
  Tax Liability Analysis
  
  Purpose: Track tax accruals, payments, and outstanding liabilities
  Tables used: gl_taxes, gl_tax_payments, gl_invoices, gl_expenses
  
  This query provides comprehensive tax analysis:
  - Tax accruals by type and period
  - Tax payments by type and period
  - Outstanding tax liabilities
  - Tax expense as percentage of revenue
*/

-- Tax accruals by type and period
WITH tax_accruals AS (
  SELECT
    DATE_TRUNC('quarter', accrual_date)::DATE AS quarter_start,
    tax_type,
    jurisdiction,
    SUM(amount) AS accrued_amount
  FROM
    gl_taxes
  WHERE
    accrual_date BETWEEN '2023-01-01' AND '2023-12-31'
  GROUP BY
    quarter_start, tax_type, jurisdiction
),

-- Tax payments by type and period
tax_payments AS (
  SELECT
    DATE_TRUNC('quarter', payment_date)::DATE AS quarter_start,
    tax_type,
    jurisdiction,
    SUM(amount) AS paid_amount
  FROM
    gl_tax_payments
  WHERE
    payment_date BETWEEN '2023-01-01' AND '2023-12-31'
  GROUP BY
    quarter_start, tax_type, jurisdiction
),

-- Revenue by quarter for percentage calculations
quarterly_revenue AS (
  SELECT
    DATE_TRUNC('quarter', invoice_date)::DATE AS quarter_start,
    SUM(total_amount) AS total_revenue
  FROM
    gl_invoices
  WHERE
    invoice_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND status = 'issued'
  GROUP BY
    quarter_start
),

-- Quarters in the period
all_quarters AS (
  SELECT
    generate_series(
      '2023-01-01'::DATE,
      '2023-10-01'::DATE,
      '3 months'::INTERVAL
    )::DATE AS quarter_start
),

-- All tax types and jurisdictions
all_tax_types AS (
  SELECT DISTINCT tax_type, jurisdiction
  FROM (
    SELECT tax_type, jurisdiction FROM tax_accruals
    UNION
    SELECT tax_type, jurisdiction FROM tax_payments
  ) all_types
),

-- Quarter and tax type matrix
quarter_tax_matrix AS (
  SELECT
    aq.quarter_start,
    att.tax_type,
    att.jurisdiction
  FROM
    all_quarters aq
    CROSS JOIN all_tax_types att
),

-- Combined tax data
tax_data AS (
  SELECT
    qtm.quarter_start,
    TO_CHAR(qtm.quarter_start, 'YYYY "Q"Q') AS quarter_name,
    qtm.tax_type,
    qtm.jurisdiction,
    COALESCE(ta.accrued_amount, 0) AS accrued_amount,
    COALESCE(tp.paid_amount, 0) AS paid_amount,
    COALESCE(ta.accrued_amount, 0) - COALESCE(tp.paid_amount, 0) AS net_liability,
    qr.total_revenue
  FROM
    quarter_tax_matrix qtm
    LEFT JOIN tax_accruals ta ON qtm.quarter_start = ta.quarter_start 
                             AND qtm.tax_type = ta.tax_type 
                             AND qtm.jurisdiction = ta.jurisdiction
    LEFT JOIN tax_payments tp ON qtm.quarter_start = tp.quarter_start 
                             AND qtm.tax_type = tp.tax_type 
                             AND qtm.jurisdiction = tp.jurisdiction
    LEFT JOIN quarterly_revenue qr ON qtm.quarter_start = qr.quarter_start
),

-- Cumulative liabilities
cumulative_tax_data AS (
  SELECT
    td.quarter_start,
    td.quarter_name,
    td.tax_type,
    td.jurisdiction,
    td.accrued_amount,
    td.paid_amount,
    td.net_liability,
    SUM(td.net_liability) OVER (
      PARTITION BY td.tax_type, td.jurisdiction
      ORDER BY td.quarter_start
    ) AS cumulative_liability,
    td.total_revenue,
    CASE
      WHEN td.total_revenue > 0 
      THEN ROUND(td.accrued_amount / NULLIF(td.total_revenue, 0) * 100, 2)
      ELSE 0
    END AS tax_as_percent_of_revenue
  FROM
    tax_data td
)

-- Main tax liability query
SELECT
  quarter_start,
  quarter_name,
  tax_type,
  jurisdiction,
  accrued_amount,
  paid_amount,
  net_liability,
  cumulative_liability,
  tax_as_percent_of_revenue
FROM
  cumulative_tax_data
ORDER BY
  quarter_start,
  tax_type,
  jurisdiction;

/*
  -- Summary by tax type
  SELECT
    tax_type,
    SUM(accrued_amount) AS total_accrued,
    SUM(paid_amount) AS total_paid,
    SUM(net_liability) AS total_net_liability,
    ROUND(AVG(tax_as_percent_of_revenue), 2) AS avg_percent_of_revenue
  FROM
    cumulative_tax_data
  GROUP BY
    tax_type
  ORDER BY
    tax_type;
*/

/*
  -- Summary by jurisdiction
  SELECT
    jurisdiction,
    SUM(accrued_amount) AS total_accrued,
    SUM(paid_amount) AS total_paid,
    SUM(net_liability) AS total_net_liability
  FROM
    cumulative_tax_data
  GROUP BY
    jurisdiction
  ORDER BY
    jurisdiction;
*/

/*
  -- Current outstanding tax liabilities
  SELECT
    tax_type,
    jurisdiction,
    SUM(net_liability) AS outstanding_liability
  FROM
    tax_data
  GROUP BY
    tax_type, jurisdiction
  HAVING
    SUM(net_liability) > 0
  ORDER BY
    outstanding_liability DESC;
*/

/*
  Example Usage:
  
  - The main query shows detailed tax data by quarter, type, and jurisdiction
  - Uncomment the summary queries for aggregated analysis
  - Adjust the date range in the CTEs to analyze different periods
  
  To calculate tax efficiency:
  
  WITH tax_efficiency AS (
    SELECT
      tax_type,
      jurisdiction,
      SUM(accrued_amount) AS total_accrued,
      (SELECT SUM(total_revenue) FROM quarterly_revenue) AS annual_revenue,
      ROUND(SUM(accrued_amount) / NULLIF((SELECT SUM(total_revenue) FROM quarterly_revenue), 0) * 100, 2) AS tax_rate
    FROM
      tax_data
    GROUP BY
      tax_type, jurisdiction
  )
  
  SELECT
    tax_type,
    jurisdiction,
    total_accrued,
    annual_revenue,
    tax_rate,
    CASE
      WHEN tax_type = 'income' AND tax_rate < 21.0 THEN 'Efficient'
      WHEN tax_type = 'income' AND tax_rate >= 21.0 THEN 'Review Needed'
      WHEN tax_type = 'sales' AND tax_rate < 8.0 THEN 'Efficient'
      WHEN tax_type = 'sales' AND tax_rate >= 8.0 THEN 'Review Needed'
      ELSE 'N/A'
    END AS efficiency_rating
  FROM
    tax_efficiency
  ORDER BY
    tax_type, tax_rate DESC;
*/ 