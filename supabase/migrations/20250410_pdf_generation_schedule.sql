-- Enable the pgcron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a table to log PDF generation activities
CREATE TABLE IF NOT EXISTS pdf_generation_logs (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on job_name and created_at for faster queries
CREATE INDEX IF NOT EXISTS pdf_generation_logs_job_name_created_at_idx ON pdf_generation_logs (job_name, created_at);

-- Add comment on table
COMMENT ON TABLE pdf_generation_logs IS 'Logs for scheduled PDF generation jobs';

-- Create a table to track failed PDF generations for retry mechanism
CREATE TABLE IF NOT EXISTS pdf_generation_failures (
  id BIGSERIAL PRIMARY KEY,
  document_type TEXT NOT NULL,
  document_id TEXT NOT NULL,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_attempt TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on document_type and document_id
CREATE UNIQUE INDEX IF NOT EXISTS pdf_generation_failures_doc_idx ON pdf_generation_failures (document_type, document_id);

-- Add index on resolved and next_attempt for faster queries
CREATE INDEX IF NOT EXISTS pdf_generation_failures_retry_idx ON pdf_generation_failures (resolved, next_attempt);

-- Add comment on table
COMMENT ON TABLE pdf_generation_failures IS 'Tracks failed PDF generations for retry mechanism';

-- Create a function to handle PDF generation failures
CREATE OR REPLACE FUNCTION log_pdf_generation_failure(
  p_document_type TEXT,
  p_document_id TEXT,
  p_error_message TEXT
) RETURNS VOID AS $$
DECLARE
  v_retry_count INTEGER;
  v_backoff_minutes INTEGER;
BEGIN
  -- First see if we already have a record for this document
  SELECT retry_count INTO v_retry_count
  FROM pdf_generation_failures
  WHERE document_type = p_document_type AND document_id = p_document_id;
  
  -- Calculate exponential backoff (2^retry_count minutes)
  IF v_retry_count IS NULL THEN
    v_retry_count := 0;
    v_backoff_minutes := 1;
  ELSE
    v_retry_count := v_retry_count + 1;
    v_backoff_minutes := GREATEST(1, LEAST(1440, POWER(2, v_retry_count))); -- Max 24 hours
  END IF;
  
  -- Insert or update the failure record
  INSERT INTO pdf_generation_failures (
    document_type, 
    document_id, 
    error_message, 
    retry_count, 
    last_attempt, 
    next_attempt
  ) VALUES (
    p_document_type,
    p_document_id,
    p_error_message,
    v_retry_count,
    NOW(),
    NOW() + (v_backoff_minutes * INTERVAL '1 minute')
  ) ON CONFLICT (document_type, document_id) DO UPDATE SET
    error_message = p_error_message,
    retry_count = pdf_generation_failures.retry_count + 1,
    last_attempt = NOW(),
    next_attempt = NOW() + (v_backoff_minutes * INTERVAL '1 minute'),
    resolved = FALSE,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to reset the failure status when PDF is successfully generated
CREATE OR REPLACE FUNCTION reset_pdf_generation_failure(
  p_document_type TEXT,
  p_document_id TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE pdf_generation_failures
  SET resolved = TRUE, updated_at = NOW()
  WHERE document_type = p_document_type 
    AND document_id = p_document_id
    AND NOT resolved;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create cron job to run every hour to scan for documents with null PDF URLs
SELECT cron.schedule(
  'pdf-scan-hourly',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT http_post(
    'https://' || current_setting('supabase_functions.url') || '/scheduled-pdf-generation',
    '{"action": "scan_null_pdfs"}',
    'application/json',
    ('Bearer ' || current_setting('supabase_functions.service_role_key')),
    60
  );
  $$
);

-- Create cron job to retry failed PDF generations every 15 minutes
SELECT cron.schedule(
  'pdf-retry-failures',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  SELECT http_post(
    'https://' || current_setting('supabase_functions.url') || '/scheduled-pdf-generation',
    '{"action": "retry_failures"}',
    'application/json',
    ('Bearer ' || current_setting('supabase_functions.service_role_key')),
    60
  );
  $$
);

-- Create database triggers for invoices
CREATE OR REPLACE FUNCTION trigger_invoice_pdf_generation() RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger PDF generation on significant field changes
  IF (TG_OP = 'UPDATE' AND (
      OLD.total_amount != NEW.total_amount OR
      OLD.due_date != NEW.due_date OR
      OLD.notes != NEW.notes OR
      OLD.payment_status != NEW.payment_status
    )) OR TG_OP = 'INSERT' THEN
    -- Call PDF generation webhook asynchronously
    PERFORM http_post(
      'https://' || current_setting('supabase_functions.url') || '/pdf-backend/trigger',
      json_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW),
        'forceRegenerate', true,
        'overwriteExisting', true
      )::text,
      'application/json',
      ('Bearer ' || current_setting('supabase_functions.service_role_key')),
      5 -- 5 second timeout
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for invoices
DROP TRIGGER IF EXISTS trigger_invoice_pdf_generation ON gl_invoices;
CREATE TRIGGER trigger_invoice_pdf_generation
  AFTER INSERT OR UPDATE
  ON gl_invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_invoice_pdf_generation();

-- Create database triggers for purchase orders
CREATE OR REPLACE FUNCTION trigger_purchase_order_pdf_generation() RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger PDF generation on significant field changes
  IF (TG_OP = 'UPDATE' AND (
      OLD.total_amount != NEW.total_amount OR
      OLD.po_date != NEW.po_date OR
      OLD.notes != NEW.notes OR
      OLD.status != NEW.status
    )) OR TG_OP = 'INSERT' THEN
    -- Call PDF generation webhook asynchronously
    PERFORM http_post(
      'https://' || current_setting('supabase_functions.url') || '/pdf-backend/trigger',
      json_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW),
        'forceRegenerate', true,
        'overwriteExisting', true
      )::text,
      'application/json',
      ('Bearer ' || current_setting('supabase_functions.service_role_key')),
      5 -- 5 second timeout
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for purchase orders
DROP TRIGGER IF EXISTS trigger_purchase_order_pdf_generation ON gl_purchase_orders;
CREATE TRIGGER trigger_purchase_order_pdf_generation
  AFTER INSERT OR UPDATE
  ON gl_purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_purchase_order_pdf_generation();

-- Create database triggers for estimates
CREATE OR REPLACE FUNCTION trigger_estimate_pdf_generation() RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger PDF generation on significant field changes
  IF (TG_OP = 'UPDATE' AND (
      OLD.total_amount != NEW.total_amount OR
      OLD.expiration_date != NEW.expiration_date OR
      OLD.notes != NEW.notes OR
      OLD.status != NEW.status
    )) OR TG_OP = 'INSERT' THEN
    -- Call PDF generation webhook asynchronously
    PERFORM http_post(
      'https://' || current_setting('supabase_functions.url') || '/pdf-backend/trigger',
      json_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW),
        'forceRegenerate', true,
        'overwriteExisting', true
      )::text,
      'application/json',
      ('Bearer ' || current_setting('supabase_functions.service_role_key')),
      5 -- 5 second timeout
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for estimates
DROP TRIGGER IF EXISTS trigger_estimate_pdf_generation ON gl_estimates;
CREATE TRIGGER trigger_estimate_pdf_generation
  AFTER INSERT OR UPDATE
  ON gl_estimates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_estimate_pdf_generation();

-- Enable row level security
ALTER TABLE pdf_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_generation_failures ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY admin_pdf_generation_logs ON pdf_generation_logs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY admin_pdf_generation_failures ON pdf_generation_failures
  FOR ALL USING (auth.role() = 'authenticated');
