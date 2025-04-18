/*
  Cash Flow Analysis
  
  Purpose: Track and analyze cash inflows and outflows over time
  Tables used: gl_payments, gl_expenses, gl_invoices
  
  This query provides various cash flow analytics:
  - Net cash flow by month/quarter
  - Cash inflow (revenue) breakdown by source
  - Cash outflow (expenses) breakdown by category
  - Running cash balance over time
*/

-- Monthly Cash Flow Analysis
WITH monthly_cash_inflow AS (
  SELECT
    DATE_TRUNC('month', payment_date)::DATE AS month_start,
    SUM(amount) AS total_inflow
  FROM
    gl_payments
  WHERE
    payment_date BETWEEN '2023-01-01' AND '2023-12-31'
  GROUP BY
    month_start
),

monthly_cash_outflow AS (
  SELECT
    DATE_TRUNC('month', payment_date)::DATE AS month_start,
    SUM(amount) AS total_outflow
  FROM
    gl_expenses
  WHERE
    payment_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND status = 'paid'
  GROUP BY
    month_start
),

all_months AS (
  SELECT
    generate_series(
      '2023-01-01'::DATE,
      '2023-12-31'::DATE,
      '1 month'::INTERVAL
    )::DATE AS month_start
)

SELECT
  am.month_start,
  TO_CHAR(am.month_start, 'Month YYYY') AS month_name,
  COALESCE(mci.total_inflow, 0) AS cash_inflow,
  COALESCE(mco.total_outflow, 0) AS cash_outflow,
  COALESCE(mci.total_inflow, 0) - COALESCE(mco.total_outflow, 0) AS net_cash_flow,
  SUM(COALESCE(mci.total_inflow, 0) - COALESCE(mco.total_outflow, 0)) 
    OVER (ORDER BY am.month_start) AS running_cash_balance
FROM
  all_months am
  LEFT JOIN monthly_cash_inflow mci ON am.month_start = mci.month_start
  LEFT JOIN monthly_cash_outflow mco ON am.month_start = mco.month_start
ORDER BY
  am.month_start;

/*
  -- Cash Inflow by Source
  SELECT
    DATE_TRUNC('month', p.payment_date)::DATE AS month_start,
    TO_CHAR(DATE_TRUNC('month', p.payment_date)::DATE, 'Month YYYY') AS month_name,
    i.payment_type,
    SUM(p.amount) AS total_inflow
  FROM
    gl_payments p
    JOIN gl_invoices i ON p.invoice_id = i.id
  WHERE
    p.payment_date BETWEEN '2023-01-01' AND '2023-12-31'
  GROUP BY
    month_start, month_name, i.payment_type
  ORDER BY
    month_start, i.payment_type;
*/

/*
  -- Cash Outflow by Category
  SELECT
    DATE_TRUNC('month', payment_date)::DATE AS month_start,
    TO_CHAR(DATE_TRUNC('month', payment_date)::DATE, 'Month YYYY') AS month_name,
    category,
    SUM(amount) AS total_outflow
  FROM
    gl_expenses
  WHERE
    payment_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND status = 'paid'
  GROUP BY
    month_start, month_name, category
  ORDER BY
    month_start, category;
*/

/*
  Example Usage:
  
  - The main query shows monthly cash flow and running balance
  - Uncomment specific sections to analyze inflow by source or outflow by category
  - Adjust the date range as needed
  
  Example for quarterly analysis:
  
  SELECT
    DATE_TRUNC('quarter', month_start)::DATE AS quarter_start,
    TO_CHAR(DATE_TRUNC('quarter', month_start)::DATE, 'YYYY "Q"Q') AS quarter_name,
    SUM(cash_inflow) AS quarterly_inflow,
    SUM(cash_outflow) AS quarterly_outflow,
    SUM(net_cash_flow) AS quarterly_net_flow
  FROM
    (
      -- Insert the main query here
    ) monthly_data
  GROUP BY
    quarter_start, quarter_name
  ORDER BY
    quarter_start;
*/ 