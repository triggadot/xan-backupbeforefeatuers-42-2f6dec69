-- Migration: PDF Generation Triggers
-- Description: Creates trigger functions and triggers for automatic PDF generation on document updates

-- Function to trigger PDF generation via webhook
CREATE OR REPLACE FUNCTION trigger_pdf_generation()
RETURNS TRIGGER AS $$
DECLARE
  v_document_type TEXT;
  v_payload JSONB;
  v_response JSONB;
BEGIN
  -- Determine document type based on the source table
  CASE TG_TABLE_NAME
    WHEN 'gl_invoices' THEN v_document_type := 'invoice';
    WHEN 'gl_estimates' THEN v_document_type := 'estimate';
    WHEN 'gl_purchase_orders' THEN v_document_type := 'purchase_order';
    ELSE RAISE EXCEPTION 'Unsupported table for PDF generation: %', TG_TABLE_NAME;
  END CASE;

  -- Create payload for the webhook
  v_payload := jsonb_build_object(
    'action', 'trigger',
    'documentType', v_document_type,
    'documentId', NEW.id,
    'forceRegenerate', FALSE, -- Only generate if null
    'overwriteExisting', TRUE -- Always overwrite if regenerating
  );

  -- Log the trigger execution
  INSERT INTO pdf_generation_logs (
    trigger_source, 
    document_type, 
    document_id, 
    trigger_type
  ) VALUES (
    TG_TABLE_NAME,
    v_document_type,
    NEW.id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'insert'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      ELSE TG_OP
    END
  );

  -- Skip webhook call on test environment
  IF current_setting('app.environment', TRUE) = 'test' THEN
    RETURN NEW;
  END IF;

  -- Call the webhook asynchronously to avoid blocking the transaction
  -- Only if the PDF URL is null or if it's a critical status change
  IF NEW.supabase_pdf_url IS NULL OR 
     (TG_OP = 'UPDATE' AND 
      (TG_TABLE_NAME = 'gl_invoices' AND NEW.status != OLD.status AND NEW.status IN ('paid', 'sent')) OR
      (TG_TABLE_NAME = 'gl_estimates' AND NEW.status != OLD.status AND NEW.status IN ('accepted', 'sent')) OR
      (TG_TABLE_NAME = 'gl_purchase_orders' AND NEW.status != OLD.status AND NEW.status IN ('received', 'sent')))
  THEN
    -- Call PDF backend edge function
    SELECT http_post(
      CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/pdf-backend'),
      v_payload::text,
      'application/json',
      ARRAY[
        CONCAT('Authorization: Bearer ', current_setting('app.settings.service_role_key'))
      ]
    ) INTO v_response;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent the transaction
    INSERT INTO pdf_generation_logs (
      trigger_source, 
      document_type, 
      document_id, 
      trigger_type,
      error_message,
      success
    ) VALUES (
      TG_TABLE_NAME,
      v_document_type,
      NEW.id,
      TG_OP,
      SQLERRM,
      FALSE
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create PDF generation logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS pdf_generation_logs (
  id SERIAL PRIMARY KEY,
  trigger_source TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  error_message TEXT,
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for PDF generation logs
ALTER TABLE pdf_generation_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view logs
CREATE POLICY "Allow authenticated users to view pdf_generation_logs" 
  ON pdf_generation_logs FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow service role to manage logs
CREATE POLICY "Allow service role to manage pdf_generation_logs" 
  ON pdf_generation_logs FOR ALL 
  USING (auth.role() = 'service_role');

-- Create index on logs
CREATE INDEX IF NOT EXISTS idx_pdf_logs_document ON pdf_generation_logs(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_pdf_logs_created_at ON pdf_generation_logs(created_at);

-- Drop existing triggers if they exist to avoid duplicates
DROP TRIGGER IF EXISTS trigger_invoice_pdf_generation ON gl_invoices;
DROP TRIGGER IF EXISTS trigger_estimate_pdf_generation ON gl_estimates;
DROP TRIGGER IF EXISTS trigger_purchase_order_pdf_generation ON gl_purchase_orders;

-- Create triggers for each table
CREATE TRIGGER trigger_invoice_pdf_generation
  AFTER INSERT OR UPDATE OF status
  ON gl_invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_pdf_generation();

CREATE TRIGGER trigger_estimate_pdf_generation
  AFTER INSERT OR UPDATE OF status
  ON gl_estimates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_pdf_generation();

CREATE TRIGGER trigger_purchase_order_pdf_generation
  AFTER INSERT OR UPDATE OF status
  ON gl_purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_pdf_generation();

-- Setup cleanup job for old logs (keep for 90 days)
SELECT cron.schedule(
  'cleanup-pdf-generation-logs',
  '0 1 * * *',  -- Run at 1 AM every day
  $$
    DELETE FROM pdf_generation_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
  $$
);
