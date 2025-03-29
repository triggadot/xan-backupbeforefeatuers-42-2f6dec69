-- Add indexes on all rowid_ fields to improve relationship query performance

-- gl_invoices indexes
CREATE INDEX IF NOT EXISTS idx_gl_invoices_rowid_accounts ON public.gl_invoices(rowid_accounts);

-- gl_invoice_lines indexes
CREATE INDEX IF NOT EXISTS idx_gl_invoice_lines_rowid_invoices ON public.gl_invoice_lines(rowid_invoices);
CREATE INDEX IF NOT EXISTS idx_gl_invoice_lines_rowid_products ON public.gl_invoice_lines(rowid_products);

-- gl_estimate_lines indexes
CREATE INDEX IF NOT EXISTS idx_gl_estimate_lines_rowid_estimates ON public.gl_estimate_lines(rowid_estimates);
CREATE INDEX IF NOT EXISTS idx_gl_estimate_lines_rowid_products ON public.gl_estimate_lines(rowid_products);

-- gl_estimates indexes
CREATE INDEX IF NOT EXISTS idx_gl_estimates_rowid_accounts ON public.gl_estimates(rowid_accounts);

-- gl_products indexes
CREATE INDEX IF NOT EXISTS idx_gl_products_rowid_accounts ON public.gl_products(rowid_accounts);
CREATE INDEX IF NOT EXISTS idx_gl_products_rowid_purchase_orders ON public.gl_products(rowid_purchase_orders);

-- gl_purchase_orders indexes
CREATE INDEX IF NOT EXISTS idx_gl_purchase_orders_rowid_accounts ON public.gl_purchase_orders(rowid_accounts);

-- gl_customer_payments indexes
CREATE INDEX IF NOT EXISTS idx_gl_customer_payments_rowid_invoices ON public.gl_customer_payments(rowid_invoices);
CREATE INDEX IF NOT EXISTS idx_gl_customer_payments_rowid_accounts ON public.gl_customer_payments(rowid_accounts);

-- gl_vendor_payments indexes
CREATE INDEX IF NOT EXISTS idx_gl_vendor_payments_rowid_purchase_orders ON public.gl_vendor_payments(rowid_purchase_orders);
CREATE INDEX IF NOT EXISTS idx_gl_vendor_payments_rowid_accounts ON public.gl_vendor_payments(rowid_accounts);

-- gl_customer_credits indexes
CREATE INDEX IF NOT EXISTS idx_gl_customer_credits_rowid_estimates ON public.gl_customer_credits(rowid_estimates);
CREATE INDEX IF NOT EXISTS idx_gl_customer_credits_rowid_accounts ON public.gl_customer_credits(rowid_accounts);

-- Add compound index for common query patterns (e.g., filtering by date and account)
CREATE INDEX IF NOT EXISTS idx_gl_invoices_account_date ON public.gl_invoices(rowid_accounts, invoice_order_date);
CREATE INDEX IF NOT EXISTS idx_gl_purchase_orders_account_date ON public.gl_purchase_orders(rowid_accounts, po_date);
CREATE INDEX IF NOT EXISTS idx_gl_estimates_account_date ON public.gl_estimates(rowid_accounts, estimate_date);

-- Add index for performance of balance calculations
CREATE INDEX IF NOT EXISTS idx_gl_customer_payments_amount ON public.gl_customer_payments(main_payment_amount);
CREATE INDEX IF NOT EXISTS idx_gl_vendor_payments_amount ON public.gl_vendor_payments(main_payment_amount);
