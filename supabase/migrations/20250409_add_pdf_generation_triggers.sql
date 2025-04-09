-- Migration: Auto PDF Generation Triggers
-- Description: Sets up database webhooks to trigger PDF generation when new documents are created

-- Create a webhook that will call our auto-generate-pdf edge function
INSERT INTO supabase_functions.hooks (hook_table_id, hook_name, hook_function_name, hook_function_schema, request_schema)
VALUES 
  ('gl_invoices', 'invoice_pdf_generation', 'http_request', 'supabase_functions', '{
    "method": "POST",
    "url": "{{supabase_functions_url}}/auto-generate-pdf",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer {{supabase_service_role_key}}"
    },
    "body": {
      "type": "{{event_type}}",
      "table": "gl_invoices",
      "schema": "{{schema_name}}",
      "record": {{record_json}},
      "old_record": {{old_record_json}}
    }
  }')
ON CONFLICT (hook_table_id, hook_name) DO UPDATE
SET 
  hook_function_name = EXCLUDED.hook_function_name,
  hook_function_schema = EXCLUDED.hook_function_schema,
  request_schema = EXCLUDED.request_schema;

-- Create a webhook for estimates
INSERT INTO supabase_functions.hooks (hook_table_id, hook_name, hook_function_name, hook_function_schema, request_schema)
VALUES 
  ('gl_estimates', 'estimate_pdf_generation', 'http_request', 'supabase_functions', '{
    "method": "POST",
    "url": "{{supabase_functions_url}}/auto-generate-pdf",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer {{supabase_service_role_key}}"
    },
    "body": {
      "type": "{{event_type}}",
      "table": "gl_estimates",
      "schema": "{{schema_name}}",
      "record": {{record_json}},
      "old_record": {{old_record_json}}
    }
  }')
ON CONFLICT (hook_table_id, hook_name) DO UPDATE
SET 
  hook_function_name = EXCLUDED.hook_function_name,
  hook_function_schema = EXCLUDED.hook_function_schema,
  request_schema = EXCLUDED.request_schema;

-- Create a webhook for purchase orders
INSERT INTO supabase_functions.hooks (hook_table_id, hook_name, hook_function_name, hook_function_schema, request_schema)
VALUES 
  ('gl_purchase_orders', 'purchase_order_pdf_generation', 'http_request', 'supabase_functions', '{
    "method": "POST",
    "url": "{{supabase_functions_url}}/auto-generate-pdf",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer {{supabase_service_role_key}}"
    },
    "body": {
      "type": "{{event_type}}",
      "table": "gl_purchase_orders",
      "schema": "{{schema_name}}",
      "record": {{record_json}},
      "old_record": {{old_record_json}}
    }
  }')
ON CONFLICT (hook_table_id, hook_name) DO UPDATE
SET 
  hook_function_name = EXCLUDED.hook_function_name,
  hook_function_schema = EXCLUDED.hook_function_schema,
  request_schema = EXCLUDED.request_schema;

-- Create trigger functions for each document type
CREATE OR REPLACE FUNCTION public.handle_invoice_pdf_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger PDF generation for new invoices (INSERT)
  -- or when existing invoices are updated to certain statuses (UPDATE)
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND 
      (OLD.payment_status IS DISTINCT FROM NEW.payment_status OR 
       OLD.status IS DISTINCT FROM NEW.status) AND
      (NEW.payment_status = 'sent' OR NEW.status = 'active'))
  THEN
    PERFORM supabase_functions.http_request(
      'invoice_pdf_generation',
      'gl_invoices',
      ROW_TO_JSON(NEW),
      CASE WHEN TG_OP = 'UPDATE' THEN ROW_TO_JSON(OLD) ELSE NULL END,
      TG_OP,
      TG_TABLE_SCHEMA
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_estimate_pdf_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger PDF generation for new estimates (INSERT)
  -- or when existing estimates are updated to certain statuses (UPDATE)
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND 
      (OLD.status IS DISTINCT FROM NEW.status) AND
      (NEW.status = 'sent' OR NEW.status = 'approved'))
  THEN
    PERFORM supabase_functions.http_request(
      'estimate_pdf_generation',
      'gl_estimates',
      ROW_TO_JSON(NEW),
      CASE WHEN TG_OP = 'UPDATE' THEN ROW_TO_JSON(OLD) ELSE NULL END,
      TG_OP,
      TG_TABLE_SCHEMA
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_purchase_order_pdf_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger PDF generation for new purchase orders (INSERT)
  -- or when existing purchase orders are updated to certain statuses (UPDATE)
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND 
      (OLD.payment_status IS DISTINCT FROM NEW.payment_status OR 
       OLD.status IS DISTINCT FROM NEW.status) AND
      (NEW.payment_status = 'sent' OR NEW.status = 'active'))
  THEN
    PERFORM supabase_functions.http_request(
      'purchase_order_pdf_generation',
      'gl_purchase_orders',
      ROW_TO_JSON(NEW),
      CASE WHEN TG_OP = 'UPDATE' THEN ROW_TO_JSON(OLD) ELSE NULL END,
      TG_OP,
      TG_TABLE_SCHEMA
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the actual triggers
DROP TRIGGER IF EXISTS trigger_invoice_pdf_generation ON gl_invoices;
CREATE TRIGGER trigger_invoice_pdf_generation
  AFTER INSERT OR UPDATE OF payment_status, status
  ON gl_invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_invoice_pdf_generation();

DROP TRIGGER IF EXISTS trigger_estimate_pdf_generation ON gl_estimates;
CREATE TRIGGER trigger_estimate_pdf_generation
  AFTER INSERT OR UPDATE OF status
  ON gl_estimates
  FOR EACH ROW
  EXECUTE FUNCTION handle_estimate_pdf_generation();

DROP TRIGGER IF EXISTS trigger_purchase_order_pdf_generation ON gl_purchase_orders;
CREATE TRIGGER trigger_purchase_order_pdf_generation
  AFTER INSERT OR UPDATE OF payment_status, status
  ON gl_purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_purchase_order_pdf_generation();
