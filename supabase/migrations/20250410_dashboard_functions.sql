-- Create functions for the dashboard

-- Function to get business statistics
CREATE OR REPLACE FUNCTION public.gl_get_business_stats()
RETURNS TABLE (
    total_customers bigint,
    total_vendors bigint,
    total_products bigint,
    total_invoice_amount numeric,
    total_estimate_amount numeric,
    total_purchase_amount numeric,
    total_payments_received numeric,
    total_payments_made numeric
) LANGUAGE sql AS $$
    SELECT 
        (SELECT COUNT(*) FROM gl_accounts WHERE is_customer = true) AS total_customers,
        (SELECT COUNT(*) FROM gl_accounts WHERE is_vendor = true) AS total_vendors,
        (SELECT COUNT(*) FROM gl_products) AS total_products,
        COALESCE((SELECT SUM(total_amount) FROM gl_invoices), 0) AS total_invoice_amount,
        COALESCE((SELECT SUM(total_amount) FROM gl_estimates), 0) AS total_estimate_amount,
        COALESCE((SELECT SUM(total_amount) FROM gl_purchase_orders), 0) AS total_purchase_amount,
        COALESCE((SELECT SUM(payment_amount) FROM gl_customer_payments WHERE type_of_payment = 'Received'), 0) AS total_payments_received,
        COALESCE((SELECT SUM(payment_amount) FROM gl_vendor_payments), 0) AS total_payments_made
$$;

-- Function to get monthly revenue data for charts
CREATE OR REPLACE FUNCTION public.gl_get_monthly_revenue(months_back integer DEFAULT 12)
RETURNS TABLE (
    month_year text,
    revenue numeric,
    expenses numeric
) LANGUAGE plpgsql AS $$
DECLARE
    start_date date;
BEGIN
    start_date := date_trunc('month', current_date - (months_back || ' month')::interval);
    
    RETURN QUERY
    WITH months AS (
        SELECT 
            to_char(date_trunc('month', d), 'Mon YYYY') as month_year,
            date_trunc('month', d) as month_start,
            date_trunc('month', d) + interval '1 month' - interval '1 day' as month_end
        FROM generate_series(
            start_date,
            date_trunc('month', current_date),
            '1 month'::interval
        ) d
    ),
    invoice_data AS (
        SELECT 
            to_char(date_trunc('month', invoice_order_date), 'Mon YYYY') as month_year,
            SUM(total_amount) as revenue
        FROM gl_invoices
        WHERE invoice_order_date >= start_date
        GROUP BY month_year
    ),
    expense_data AS (
        SELECT 
            to_char(date_trunc('month', date), 'Mon YYYY') as month_year,
            SUM(amount) as expenses
        FROM gl_expenses
        WHERE date >= start_date
        GROUP BY month_year
    )
    SELECT 
        m.month_year,
        COALESCE(i.revenue, 0) as revenue,
        COALESCE(e.expenses, 0) as expenses
    FROM months m
    LEFT JOIN invoice_data i ON m.month_year = i.month_year
    LEFT JOIN expense_data e ON m.month_year = e.month_year
    ORDER BY m.month_start;
END;
$$;

-- Function to get invoice metrics
CREATE OR REPLACE FUNCTION public.gl_get_invoice_metrics()
RETURNS TABLE (
    total_invoice_amount numeric,
    paid_invoice_amount numeric,
    unpaid_invoice_amount numeric,
    invoice_count bigint,
    paid_invoice_count bigint,
    unpaid_invoice_count bigint,
    avg_invoice_amount numeric
) LANGUAGE sql AS $$
    SELECT 
        COALESCE(SUM(total_amount), 0) AS total_invoice_amount,
        COALESCE(SUM(CASE WHEN invoice_paid THEN total_amount ELSE 0 END), 0) AS paid_invoice_amount,
        COALESCE(SUM(CASE WHEN NOT invoice_paid THEN total_amount ELSE 0 END), 0) AS unpaid_invoice_amount,
        COUNT(*) AS invoice_count,
        COUNT(CASE WHEN invoice_paid THEN 1 END) AS paid_invoice_count,
        COUNT(CASE WHEN NOT invoice_paid THEN 1 END) AS unpaid_invoice_count,
        CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*) ELSE 0 END AS avg_invoice_amount
    FROM gl_invoices
    WHERE invoice_order_date >= CURRENT_DATE - INTERVAL '365 days'
$$;

-- Function to get purchase order metrics
CREATE OR REPLACE FUNCTION public.gl_get_purchase_order_metrics()
RETURNS TABLE (
    total_purchase_amount numeric,
    received_purchase_amount numeric,
    pending_purchase_amount numeric,
    purchase_count bigint,
    received_purchase_count bigint,
    pending_purchase_count bigint,
    avg_purchase_amount numeric
) LANGUAGE sql AS $$
    SELECT 
        COALESCE(SUM(total_amount), 0) AS total_purchase_amount,
        COALESCE(SUM(CASE WHEN received THEN total_amount ELSE 0 END), 0) AS received_purchase_amount,
        COALESCE(SUM(CASE WHEN NOT received THEN total_amount ELSE 0 END), 0) AS pending_purchase_amount,
        COUNT(*) AS purchase_count,
        COUNT(CASE WHEN received THEN 1 END) AS received_purchase_count,
        COUNT(CASE WHEN NOT received THEN 1 END) AS pending_purchase_count,
        CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*) ELSE 0 END AS avg_purchase_amount
    FROM gl_purchase_orders
    WHERE purchase_order_date >= CURRENT_DATE - INTERVAL '365 days'
$$;

-- Function to get recent transactions (combined customer and vendor payments)
CREATE OR REPLACE FUNCTION public.gl_get_recent_transactions(days_back integer DEFAULT 30, limit_count integer DEFAULT 10)
RETURNS TABLE (
    id text,
    date timestamp with time zone,
    description text,
    amount numeric,
    type text,
    status text,
    note text
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    (
        -- Customer payments (incoming)
        SELECT 
            cp.id::text,
            cp.date_of_payment as date,
            'Payment from ' || a.account_name as description,
            cp.payment_amount as amount,
            'deposit' as type,
            'completed' as status,
            cp.payment_note as note
        FROM gl_customer_payments cp
        JOIN gl_accounts a ON cp.rowid_accounts = a.glide_row_id
        WHERE cp.type_of_payment = 'Received'
        AND cp.date_of_payment >= NOW() - (days_back || ' day')::interval
        
        UNION ALL
        
        -- Vendor payments (outgoing)
        SELECT 
            vp.id::text,
            vp.date_of_payment as date,
            'Payment to ' || a.account_name as description,
            vp.payment_amount as amount,
            'withdrawal' as type,
            'completed' as status,
            vp.vendor_purchase_note as note
        FROM gl_vendor_payments vp
        JOIN gl_accounts a ON vp.rowid_accounts = a.glide_row_id
        WHERE vp.date_of_payment >= NOW() - (days_back || ' day')::interval
    )
    ORDER BY date DESC
    LIMIT limit_count;
END;
$$;
