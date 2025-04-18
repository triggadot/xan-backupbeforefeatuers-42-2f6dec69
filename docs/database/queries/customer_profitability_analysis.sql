/*
  Customer Profitability Analysis
  
  Purpose: Analyze customer profitability to identify high-value customers
  Tables used: gl_invoices, gl_accounts, gl_expenses
  
  This query provides per-customer metrics:
  - Total revenue
  - Total expenses associated with the customer
  - Gross profit
  - Profit margin (as percentage)
  
  Results are ordered by profit margin and total revenue to highlight the most profitable customers.
*/

SELECT
  a.id AS customer_id,
  a.account_name AS customer_name,
  COUNT(DISTINCT i.id) AS total_invoices,
  SUM(i.total_amount) AS total_revenue,
  COALESCE(SUM(e.amount), 0) AS total_expenses,
  SUM(i.total_amount) - COALESCE(SUM(e.amount), 0) AS gross_profit,
  CASE
    WHEN SUM(i.total_amount) = 0 THEN 0
    ELSE ROUND((SUM(i.total_amount) - COALESCE(SUM(e.amount), 0)) / SUM(i.total_amount) * 100, 2)
  END AS profit_margin_percentage
FROM
  gl_accounts a
  LEFT JOIN gl_invoices i ON a.id = i.customer_id
  LEFT JOIN gl_expenses e ON i.id = e.invoice_id
WHERE
  a.client_type = 'customer'
  AND i.date_of_invoice >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY
  a.id, a.account_name
HAVING
  SUM(i.total_amount) > 0
ORDER BY
  profit_margin_percentage DESC,
  total_revenue DESC;

/*
  Example Usage:
  
  - Modify the WHERE clause date range to analyze different time periods
  - Add filters for specific customer segments or regions
  - Focus only on customers with minimum revenue thresholds
  
  Example Extension (with quarterly breakdown):
  
  SELECT
    a.id AS customer_id,
    a.account_name AS customer_name,
    EXTRACT(QUARTER FROM i.date_of_invoice) AS quarter,
    COUNT(DISTINCT i.id) AS total_invoices,
    SUM(i.total_amount) AS total_revenue,
    COALESCE(SUM(e.amount), 0) AS total_expenses,
    SUM(i.total_amount) - COALESCE(SUM(e.amount), 0) AS gross_profit,
    CASE
      WHEN SUM(i.total_amount) = 0 THEN 0
      ELSE ROUND((SUM(i.total_amount) - COALESCE(SUM(e.amount), 0)) / SUM(i.total_amount) * 100, 2)
    END AS profit_margin_percentage
  FROM
    gl_accounts a
    LEFT JOIN gl_invoices i ON a.id = i.customer_id
    LEFT JOIN gl_expenses e ON i.id = e.invoice_id
  WHERE
    a.client_type = 'customer'
    AND i.date_of_invoice >= DATE_TRUNC('year', CURRENT_DATE)
  GROUP BY
    a.id, a.account_name, quarter
  HAVING
    SUM(i.total_amount) > 0
  ORDER BY
    customer_name, quarter;
*/ 