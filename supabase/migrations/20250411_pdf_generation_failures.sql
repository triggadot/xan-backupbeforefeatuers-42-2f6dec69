-- Migration: PDF Generation Failure Tracking
-- Description: Creates tables and functions for tracking PDF generation failures and implementing retry mechanisms

-- Create table for tracking PDF generation failures
CREATE TABLE IF NOT EXISTS pdf_generation_failures (
  id SERIAL PRIMARY KEY,
  document_type TEXT NOT NULL,
  document_id TEXT NOT NULL,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  first_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  requires_manual_intervention BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate entries
  UNIQUE(document_type, document_id)
);

-- Add RLS policies for the failures table
ALTER TABLE pdf_generation_failures ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view failures
CREATE POLICY "Allow authenticated users to view pdf_generation_failures" 
  ON pdf_generation_failures FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow service role to manage failures
CREATE POLICY "Allow service role to manage pdf_generation_failures" 
  ON pdf_generation_failures FOR ALL 
  USING (auth.role() = 'service_role');

-- Function to log a PDF generation failure with exponential backoff
CREATE OR REPLACE FUNCTION log_pdf_generation_failure(
  p_document_type TEXT,
  p_document_id TEXT,
  p_error_message TEXT
) RETURNS VOID AS $$
DECLARE
  v_existing_record pdf_generation_failures%ROWTYPE;
  v_retry_count INTEGER;
  v_backoff_minutes INTEGER;
  v_next_attempt TIMESTAMPTZ;
BEGIN
  -- Check if we already have a record for this document
  SELECT * INTO v_existing_record 
  FROM pdf_generation_failures 
  WHERE document_type = p_document_type AND document_id = p_document_id;
  
  IF v_existing_record.id IS NULL THEN
    -- First failure, create new record
    INSERT INTO pdf_generation_failures (
      document_type, 
      document_id, 
      error_message, 
      retry_count,
      first_attempt,
      last_attempt,
      next_attempt
    ) VALUES (
      p_document_type,
      p_document_id,
      p_error_message,
      1,
      NOW(),
      NOW(),
      NOW() + INTERVAL '5 minutes'
    );
  ELSE
    -- Existing failure, update with exponential backoff
    v_retry_count := v_existing_record.retry_count + 1;
    
    -- Calculate exponential backoff (5, 15, 30, 60, 120, 240, 480, 960, 1440 minutes)
    -- Cap at 24 hours (1440 minutes)
    v_backoff_minutes := LEAST(5 * POWER(2, v_retry_count - 1), 1440);
    v_next_attempt := NOW() + (v_backoff_minutes * INTERVAL '1 minute');
    
    -- Update the record
    UPDATE pdf_generation_failures
    SET 
      error_message = p_error_message,
      retry_count = v_retry_count,
      last_attempt = NOW(),
      next_attempt = v_next_attempt,
      updated_at = NOW(),
      -- Mark for manual intervention after 10 failures
      requires_manual_intervention = (v_retry_count >= 10)
    WHERE document_type = p_document_type AND document_id = p_document_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset a PDF generation failure after successful generation
CREATE OR REPLACE FUNCTION reset_pdf_generation_failure(
  p_document_type TEXT,
  p_document_id TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE pdf_generation_failures
  SET 
    resolved = TRUE,
    updated_at = NOW()
  WHERE document_type = p_document_type AND document_id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Setup a scheduled job to clean up old resolved failures (keep for 30 days)
SELECT cron.schedule(
  'cleanup-resolved-pdf-failures',
  '0 0 * * *',  -- Run at midnight every day
  $$
    DELETE FROM pdf_generation_failures
    WHERE resolved = TRUE AND updated_at < NOW() - INTERVAL '30 days';
  $$
);

-- Function to get failures that require manual intervention
CREATE OR REPLACE FUNCTION get_manual_intervention_failures()
RETURNS SETOF pdf_generation_failures AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM pdf_generation_failures
  WHERE requires_manual_intervention = TRUE AND resolved = FALSE
  ORDER BY last_attempt ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add this to existing pg_cron job or create a new one for retry processing
SELECT cron.schedule(
  'process-pdf-generation-retries',
  '*/10 * * * *',  -- Run every 10 minutes
  $$
    SELECT http_post(
      CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/pdf-backend'),
      '{"action":"retry","maxRetries":10,"batchSize":20}',
      'application/json',
      ARRAY[
        CONCAT('Authorization: Bearer ', current_setting('app.settings.service_role_key'))
      ]
    ) AS response;
  $$
);

-- Add indices for better performance
CREATE INDEX IF NOT EXISTS idx_pdf_failures_document ON pdf_generation_failures(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_pdf_failures_next_attempt ON pdf_generation_failures(next_attempt) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_pdf_failures_manual ON pdf_generation_failures(requires_manual_intervention) WHERE requires_manual_intervention = TRUE AND resolved = FALSE;
