
import { supabase } from '@/integrations/supabase/client';
import type { DocumentType } from '@/types/documents';

export const getPdfUrl = (documentType: DocumentType, documentId: string): Promise<string | null> => {
  const tableMap: Record<DocumentType, string> = {
    'invoice': 'gl_invoices',
    'estimate': 'gl_estimates',
    'purchase_order': 'gl_purchase_orders'
  };

  const table = tableMap[documentType];
  
  return supabase
    .from(table)
    .select('supabase_pdf_url')
    .eq('id', documentId)
    .single()
    .then(({ data, error }) => {
      if (error) throw error;
      return data?.supabase_pdf_url || null;
    });
};

export const updatePdfUrl = async (
  documentType: DocumentType, 
  documentId: string, 
  pdfUrl: string
): Promise<void> => {
  const tableMap: Record<DocumentType, string> = {
    'invoice': 'gl_invoices',
    'estimate': 'gl_estimates',
    'purchase_order': 'gl_purchase_orders'
  };

  const table = tableMap[documentType];
  
  const { error } = await supabase
    .from(table)
    .update({ supabase_pdf_url: pdfUrl })
    .eq('id', documentId);

  if (error) throw error;
};
