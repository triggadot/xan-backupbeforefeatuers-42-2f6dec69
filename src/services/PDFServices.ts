
import { supabase } from '@/integrations/supabase/client';
import { DocumentType, PDFGenerationOptions, PDFGenerationResult } from '@/types/documents/pdf.unified';

/**
 * Service for handling PDF generation and storage
 */
export const pdfService = {
  /**
   * Generate a PDF document
   */
  async generatePDF(
    documentType: DocumentType | string,
    documentId: string,
    options?: Partial<PDFGenerationOptions>
  ): Promise<PDFGenerationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          action: 'generate',
          documentType,
          documentId,
          forceRegenerate: options?.forceRegenerate || false
        }
      });

      if (error) {
        console.error('PDF generation failed:', error);
        return {
          success: false,
          error: error.message,
          documentId,
          documentType: documentType as DocumentType
        };
      }

      return {
        success: true,
        url: data?.url,
        documentId,
        documentType: documentType as DocumentType
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId,
        documentType: documentType as DocumentType
      };
    }
  },

  /**
   * Update PDF URL in database
   */
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
        case DocumentType.PRODUCT:
          tableName = 'gl_products';
          break;
        default:
          throw new Error(`Invalid document type: ${documentType}`);
      }

      const { error } = await supabase
        .from(tableName)
        .update({
          supabase_pdf_url: pdfUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error updating PDF URL:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating PDF URL:', error);
      return false;
    }
  }
};
