-- This migration adds triggers for automatic PDF generation
-- when documents are created or updated

-- Trigger function for invoice PDF generation
CREATE OR REPLACE FUNCTION public.queue_invoice_pdf_generation()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR
     (TG_OP = 'UPDATE' AND
      (NEW.payment_status != OLD.payment_status OR
       NEW.total_amount != OLD.total_amount OR
       NEW.total_paid != OLD.total_paid OR
       NEW.balance != OLD.balance)) THEN

    -- Add to the PDF generation queue
    INSERT INTO public.gl_pdf_generation_queue(document_type, document_id)
    VALUES ('invoice', NEW.id);

    -- Record this trigger
    PERFORM public.record_pdf_generation(
      'invoice',
      NEW.id,
      'database-trigger',
      TG_OP
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for estimate PDF generation
CREATE OR REPLACE FUNCTION public.queue_estimate_pdf_generation()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR
     (TG_OP = 'UPDATE' AND
      (NEW.status != OLD.status OR
       NEW.total_amount != OLD.total_amount)) THEN

    -- Add to the PDF generation queue
    INSERT INTO public.gl_pdf_generation_queue(document_type, document_id)
    VALUES ('estimate', NEW.id);

    -- Record this trigger
    PERFORM public.record_pdf_generation(
      'estimate',
      NEW.id,
      'database-trigger',
      TG_OP
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for purchase order PDF generation
CREATE OR REPLACE FUNCTION public.queue_purchase_order_pdf_generation()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR
     (TG_OP = 'UPDATE' AND
      (NEW.payment_status != OLD.payment_status OR
       NEW.total_amount != OLD.total_amount OR
       NEW.total_paid != OLD.total_paid OR
       NEW.balance != OLD.balance)) THEN

    -- Add to the PDF generation queue
    INSERT INTO public.gl_pdf_generation_queue(document_type, document_id)
    VALUES ('purchase_order', NEW.id);

    -- Record this trigger
    PERFORM public.record_pdf_generation(
      'purchase_order',
      NEW.id,
      'database-trigger',
      TG_OP
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the triggers on the tables
DROP TRIGGER IF EXISTS invoice_pdf_trigger ON public.gl_invoices;
CREATE TRIGGER invoice_pdf_trigger
AFTER INSERT OR UPDATE ON public.gl_invoices
FOR EACH ROW
EXECUTE FUNCTION public.queue_invoice_pdf_generation();

DROP TRIGGER IF EXISTS estimate_pdf_trigger ON public.gl_estimates;
CREATE TRIGGER estimate_pdf_trigger
AFTER INSERT OR UPDATE ON public.gl_estimates
FOR EACH ROW
EXECUTE FUNCTION public.queue_estimate_pdf_generation();

DROP TRIGGER IF EXISTS purchase_order_pdf_trigger ON public.gl_purchase_orders;
CREATE TRIGGER purchase_order_pdf_trigger
AFTER INSERT OR UPDATE ON public.gl_purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.queue_purchase_order_pdf_generation();
