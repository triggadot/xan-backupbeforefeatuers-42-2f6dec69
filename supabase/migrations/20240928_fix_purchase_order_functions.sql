
-- Function to get purchase orders with filter options
CREATE OR REPLACE FUNCTION get_purchase_orders(
  p_vendor_id TEXT DEFAULT NULL,
  p_payment_status TEXT DEFAULT NULL,
  p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS SETOF gl_purchase_orders AS $$
BEGIN
  RETURN QUERY
  SELECT po.*
  FROM gl_purchase_orders po
  WHERE (p_vendor_id IS NULL OR po.rowid_accounts = p_vendor_id)
    AND (p_payment_status IS NULL OR po.payment_status = p_payment_status)
    AND (p_date_from IS NULL OR po.po_date >= p_date_from)
    AND (p_date_to IS NULL OR po.po_date <= p_date_to)
  ORDER BY po.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get a purchase order by ID
CREATE OR REPLACE FUNCTION get_purchase_order_by_id(p_id TEXT)
RETURNS SETOF gl_purchase_orders AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM gl_purchase_orders
  WHERE glide_row_id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user-accessible tables
CREATE OR REPLACE FUNCTION gl_get_user_tables()
RETURNS SETOF TEXT AS $$
BEGIN
  RETURN QUERY
  SELECT table_name::TEXT
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name LIKE 'gl_%'
  ORDER BY table_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get columns for a specific table
CREATE OR REPLACE FUNCTION gl_get_table_columns(table_name TEXT)
RETURNS TABLE(
  column_name TEXT,
  data_type TEXT,
  is_nullable BOOLEAN,
  column_default TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    (c.is_nullable = 'YES')::BOOLEAN,
    c.column_default::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = table_name
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

