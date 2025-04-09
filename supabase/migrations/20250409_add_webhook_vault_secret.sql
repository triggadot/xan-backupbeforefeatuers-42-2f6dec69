-- Enable vault extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vault;

-- Create the webhook URL in the vault
INSERT INTO vault.secrets (name, description, secret)
VALUES (
  'n8n_pdf_webhook',
  'N8N webhook URL for PDF generation notifications',
  'https://n8n.srv770266.hstgr.cloud/webhook-test/add_doc_to_vector_db'
);

-- To update the secret (if it already exists):
/*
UPDATE vault.secrets
SET secret = 'https://n8n.srv770266.hstgr.cloud/webhook-test/add_doc_to_vector_db'
WHERE name = 'n8n_pdf_webhook';
*/
