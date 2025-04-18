/*
  Profitability Analysis
  
  Purpose: Analyze profit margins by customer, product, or time period
  Tables used: gl_invoices, gl_invoice_items, gl_products, gl_expenses
  
  This query provides multiple perspectives on profitability:
  - Gross profit margin by customer
  - Net profit after allocating expenses
  - Profit trend analysis over time
  
  Results help identify most and least profitable customers/products.
*/

-- 1. Customer Profitability Analysis
WITH customer_sales AS (
  SELECT
    c.id AS customer_id,
    c.name AS customer_name,
    SUM(ii.quantity * ii.unit_price) AS total_sales,
    SUM(ii.quantity * p.cost_price) AS total_cost,
    COUNT(DISTINCT i.id) AS invoice_count
  FROM
    gl_invoices i
    JOIN gl_customers c ON i.customer_id = c.id
    JOIN gl_invoice_items ii ON i.id = ii.invoice_id
    JOIN gl_products p ON ii.product_id = p.id
  WHERE
    i.invoice_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND i.status != 'cancelled'
  GROUP BY
    c.id, c.name
)

SELECT
  customer_id,
  customer_name,
  total_sales,
  total_cost,
  (total_sales - total_cost) AS gross_profit,
  ROUND(((total_sales - total_cost) / NULLIF(total_sales, 0)) * 100, 2) AS gross_margin_percentage,
  invoice_count,
  ROUND((total_sales - total_cost) / NULLIF(invoice_count, 0), 2) AS avg_profit_per_invoice
FROM
  customer_sales
ORDER BY
  gross_profit DESC;

-- 2. Product Profitability Analysis
/*
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.category,
  SUM(ii.quantity) AS units_sold,
  SUM(ii.quantity * ii.unit_price) AS total_revenue,
  SUM(ii.quantity * p.cost_price) AS total_cost,
  SUM(ii.quantity * (ii.unit_price - p.cost_price)) AS total_profit,
  ROUND(SUM(ii.quantity * (ii.unit_price - p.cost_price)) / 
    NULLIF(SUM(ii.quantity * ii.unit_price), 0) * 100, 2) AS profit_margin_percentage
FROM
  gl_invoice_items ii
  JOIN gl_products p ON ii.product_id = p.id
  JOIN gl_invoices i ON ii.invoice_id = i.id
WHERE
  i.invoice_date BETWEEN '2023-01-01' AND '2023-12-31'
  AND i.status != 'cancelled'
GROUP BY
  p.id, p.name, p.category
ORDER BY
  total_profit DESC;
*/

-- 3. Monthly Profitability Trend
/*
SELECT
  TO_CHAR(DATE_TRUNC('month', i.invoice_date), 'YYYY-MM') AS month,
  SUM(ii.quantity * ii.unit_price) AS monthly_revenue,
  SUM(ii.quantity * p.cost_price) AS monthly_cost,
  SUM(ii.quantity * (ii.unit_price - p.cost_price)) AS monthly_gross_profit,
  ROUND(SUM(ii.quantity * (ii.unit_price - p.cost_price)) / 
    NULLIF(SUM(ii.quantity * ii.unit_price), 0) * 100, 2) AS monthly_margin_percentage,
  
  -- Compare to previous month (optional - requires window functions)
  ROUND(
    (SUM(ii.quantity * (ii.unit_price - p.cost_price)) - 
     LAG(SUM(ii.quantity * (ii.unit_price - p.cost_price)), 1, 0) OVER (ORDER BY DATE_TRUNC('month', i.invoice_date))) /
    NULLIF(LAG(SUM(ii.quantity * (ii.unit_price - p.cost_price)), 1, 0) 
           OVER (ORDER BY DATE_TRUNC('month', i.invoice_date)), 0) * 100,
    2) AS profit_growth_percentage
FROM
  gl_invoices i
  JOIN gl_invoice_items ii ON i.id = ii.invoice_id
  JOIN gl_products p ON ii.product_id = p.id
WHERE
  i.invoice_date BETWEEN '2023-01-01' AND '2023-12-31'
  AND i.status != 'cancelled'
GROUP BY
  DATE_TRUNC('month', i.invoice_date)
ORDER BY
  DATE_TRUNC('month', i.invoice_date);
*/

/*
  Example Usage:
  
  - Uncomment the desired analysis query
  - Adjust the date range to analyze a specific period
  - For Customer Analysis: Add WHERE clause to filter specific customers
  - For Product Analysis: Add WHERE clause to filter by product category
  
  Example for quarterly analysis instead of monthly:
  
  SELECT
    TO_CHAR(DATE_TRUNC('quarter', i.invoice_date), 'YYYY-"Q"Q') AS quarter,
    SUM(ii.quantity * ii.unit_price) AS quarterly_revenue,
    SUM(ii.quantity * p.cost_price) AS quarterly_cost,
    SUM(ii.quantity * (ii.unit_price - p.cost_price)) AS quarterly_gross_profit,
    ROUND(SUM(ii.quantity * (ii.unit_price - p.cost_price)) / 
      NULLIF(SUM(ii.quantity * ii.unit_price), 0) * 100, 2) AS quarterly_margin_percentage
  FROM
    gl_invoices i
    JOIN gl_invoice_items ii ON i.id = ii.invoice_id
    JOIN gl_products p ON ii.product_id = p.id
  WHERE
    i.invoice_date BETWEEN '2023-01-01' AND '2023-12-31'
    AND i.status != 'cancelled'
  GROUP BY
    DATE_TRUNC('quarter', i.invoice_date)
  ORDER BY
    DATE_TRUNC('quarter', i.invoice_date);
*/ 