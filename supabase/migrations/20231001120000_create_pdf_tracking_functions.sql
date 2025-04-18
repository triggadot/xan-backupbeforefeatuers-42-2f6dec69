-- This migration adds tracking functions for PDF generation
-- to improve reliability and monitoring

-- Function to record a PDF generation attempt
CREATE OR REPLACE FUNCTION public.record_pdf_generation(
  doc_type TEXT,
  doc_id UUID,
  trigger_source TEXT,
  trigger_type TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Make sure the pdf_generation_logs table exists before inserting
  INSERT INTO public.pdf_generation_logs(
    document_type,
    document_id,
    trigger_source,
    trigger_type,
    success,
    error_message
  ) VALUES (
    doc_type,
    doc_id::TEXT,
    trigger_source,
    trigger_type,
    success,
    error_message
  );
END;
$$ LANGUAGE plpgsql;

-- Function to register failed generation for retry
CREATE OR REPLACE FUNCTION public.register_pdf_failure(
  doc_type TEXT,
  doc_id UUID,
  error_message TEXT
) RETURNS VOID AS $$
DECLARE
  existing_failure INTEGER;
BEGIN
  -- Check if this document failure is already registered
  SELECT COUNT(*) INTO existing_failure
  FROM public.pdf_generation_failures
  WHERE document_type = doc_type
  AND document_id = doc_id::TEXT
  AND resolved = false;

  -- Only add if not already tracked
  IF existing_failure = 0 THEN
    INSERT INTO public.pdf_generation_failures(
      document_type,
      document_id,
      error_message
    ) VALUES (
      doc_type,
      doc_id::TEXT,
      error_message
    );
  ELSE
    -- Update existing record with new error and increment retry count
    UPDATE public.pdf_generation_failures
    SET
      error_message = error_message,
      retry_count = retry_count + 1,
      last_attempt = NOW(),
      next_attempt = NOW() + (INTERVAL '5 minutes' * retry_count)
    WHERE document_type = doc_type
    AND document_id = doc_id::TEXT
    AND resolved = false;
  END IF;

  -- Record this in logs as well
  PERFORM public.record_pdf_generation(
    doc_type,
    doc_id,
    'failure-tracking',
    'system',
    false,
    error_message
  );
END;
$$ LANGUAGE plpgsql;
