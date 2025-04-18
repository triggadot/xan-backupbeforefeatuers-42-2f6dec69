
import { supabase } from '@/lib/supabaseClient';
import { DocumentType, PDFGenerationOptions, PDFGenerationResult } from '@/types/pdf-types';

export const pdfService = {
  async generatePDF(
    documentType: DocumentType,
    documentId: string,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          documentType,
          documentId,
          forceRegenerate: options?.forceRegenerate
        }
      });

      if (error) throw error;

      return {
        success: true,
        url: data?.url,
        documentId,
        documentType
      };
    } catch (error) {
      console.error('PDF generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId,
        documentType
      };
    }
  },

  async updatePdfUrl(
    documentType: DocumentType,
    documentId: string,
    pdfUrl: string
  ): Promise<boolean> {
    try {
      let tableName: string;
      switch (documentType) {
        case DocumentType.INVOICE:
          tableName = 'gl_invoices';
          break;
        case DocumentType.ESTIMATE:
          tableName = 'gl_estimates';
          break;
        case DocumentType.PURCHASE_ORDER:
          tableName = 'gl_purchase_orders';
          break;
        default:
          throw new Error(`Invalid document type: ${documentType}`);
      }

      const { error } = await supabase
        .from(tableName)
        .update({ supabase_pdf_url: pdfUrl })
        .eq('id', documentId);

      return !error;
    } catch (error) {
      console.error('Error updating PDF URL:', error);
      return false;
    }
  }
};
