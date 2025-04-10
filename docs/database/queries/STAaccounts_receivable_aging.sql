/*
  Accounts Receivable Aging Analysis
  
  Purpose: Track outstanding customer invoices by age categories
  Tables used: gl_invoices, gl_customers, gl_payments
  
  This query categorizes unpaid invoices into aging buckets:
  - Current (not yet due)
  - 1-30 days past due
  - 31-60 days past due
  - 61-90 days past due
  - Over 90 days past due
  
  Results help identify collection issues and potential bad debts.
*/

WITH invoice_payments AS (
  -- Calculate the total payment amount for each invoice
  SELECT
    invoice_id,
    SUM(amount) AS total_paid
  FROM
    gl_payments
  WHERE
    payment_date <= CURRENT_DATE
  GROUP BY
    invoice_id
),

aged_receivables AS (
  SELECT
    i.id AS invoice_id,
    i.invoice_number,
    c.id AS customer_id,
    c.name AS customer_name,
    i.invoice_date,
    i.due_date,
    i.total_amount,
    COALESCE(ip.total_paid, 0) AS amount_paid,
    (i.total_amount - COALESCE(ip.total_paid, 0)) AS balance_due,
    CURRENT_DATE - i.due_date AS days_overdue,
    CASE
      WHEN i.due_date >= CURRENT_DATE THEN 'Current'
      WHEN CURRENT_DATE - i.due_date BETWEEN 1 AND 30 THEN '1-30 days'
      WHEN CURRENT_DATE - i.due_date BETWEEN 31 AND 60 THEN '31-60 days'
      WHEN CURRENT_DATE - i.due_date BETWEEN 61 AND 90 THEN '61-90 days'
      ELSE 'Over 90 days'
    END AS aging_category
  FROM
    gl_invoices i
    JOIN gl_customers c ON i.customer_id = c.id
    LEFT JOIN invoice_payments ip ON i.id = ip.invoice_id
  WHERE
    i.status = 'issued'
    AND (i.total_amount - COALESCE(ip.total_paid, 0)) > 0
)

-- Summary by Customer and Aging Category
SELECT
  customer_id,
  customer_name,
  SUM(CASE WHEN aging_category = 'Current' THEN balance_due ELSE 0 END) AS current_amount,
  SUM(CASE WHEN aging_category = '1-30 days' THEN balance_due ELSE 0 END) AS "1_30_days",
  SUM(CASE WHEN aging_category = '31-60 days' THEN balance_due ELSE 0 END) AS "31_60_days",
  SUM(CASE WHEN aging_category = '61-90 days' THEN balance_due ELSE 0 END) AS "61_90_days",
  SUM(CASE WHEN aging_category = 'Over 90 days' THEN balance_due ELSE 0 END) AS over_90_days,
  SUM(balance_due) AS total_outstanding
FROM
  aged_receivables
GROUP BY
  customer_id, customer_name
ORDER BY
  total_outstanding DESC;

/*
  -- Detailed Invoice Level Aging Report
  SELECT
    invoice_id,
    invoice_number,
    customer_name,
    invoice_date,
    due_date,
    total_amount,
    amount_paid,
    balance_due,
    days_overdue,
    aging_category
  FROM
    aged_receivables
  ORDER BY
    days_overdue DESC;
*/

/*
  Example Usage:
  
  - The main query shows a summary by customer and aging category
  - Uncomment the detailed report for invoice-level details
  - Adjust the aging buckets if needed (e.g., weekly instead of monthly)
  
  Example to calculate additional metrics:
  
  SELECT
    COUNT(DISTINCT customer_id) AS customers_with_overdue,
    SUM(CASE WHEN aging_category != 'Current' THEN balance_due ELSE 0 END) AS total_overdue,
    AVG(CASE WHEN aging_category != 'Current' THEN days_overdue ELSE NULL END) AS avg_days_overdue
  FROM
    aged_receivables;
*/ 