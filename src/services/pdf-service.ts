
import { supabase } from '@/lib/supabaseClient';
import { DocumentType, PDFGenerationOptions, PDFGenerationResult } from '@/types/pdf-types';

/**
 * PDF service for generating, storing, and managing PDFs
 */
export const pdfService = {
  /**
   * Generate a PDF document using client-side jsPDF first, with fallback to server-side generation
   * @param documentType - Type of document to generate
   * @param documentId - Document ID to generate PDF for
   * @param options - PDF generation options
   * @returns Promise with the PDF generation result
   */
  async generatePDF(
    documentType: DocumentType,
    documentId: string,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    try {
      // First, check if we already have a stored PDF URL and don't need to regenerate
      if (!options?.forceRegenerate) {
        const existingUrl = await this.getExistingPdfUrl(documentType, documentId);
        if (existingUrl) {
          return {
            success: true,
            url: existingUrl,
            documentId,
            documentType
          };
        }
      }

      // If we need to generate or regenerate, call the pdf-backend function
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          documentType,
          documentId,
          forceRegenerate: options?.forceRegenerate
        }
      });

      if (error) throw error;
      
      // If successful, return the URL
      if (data?.url) {
        return {
          success: true,
          url: data.url,
          documentId,
          documentType
        };
      } else {
        throw new Error(data?.error || 'No URL returned from PDF generation');
      }
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

  /**
   * Get existing PDF URL from the database
   * @param documentType - Type of document
   * @param documentId - Document ID
   * @returns Promise with the URL if found, null otherwise
   */
  async getExistingPdfUrl(
    documentType: DocumentType,
    documentId: string
  ): Promise<string | null> {
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

      const { data, error } = await supabase
        .from(tableName)
        .select('supabase_pdf_url')
        .eq('id', documentId)
        .single();

      if (error || !data) return null;
      
      return data.supabase_pdf_url || null;
    } catch (error) {
      console.error('Error getting existing PDF URL:', error);
      return null;
    }
  },

  /**
   * Update the PDF URL in the database
   * @param documentType - Type of document
   * @param documentId - Document ID
   * @param pdfUrl - URL of the PDF
   * @returns Promise resolving to boolean indicating success
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
  },

  /**
   * Request batch generation of PDFs on the server
   * @param documentType - Type of document
   * @param documentId - Document ID
   * @returns Promise resolving to boolean indicating success
   */
  async batchGeneratePDF(
    documentType: DocumentType,
    documentId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          action: 'generate',
          documentType,
          documentId,
          forceRegenerate: true,
          overwriteExisting: true
        }
      });

      if (error) throw error;
      return data?.success ?? false;
    } catch (error) {
      console.error('Error requesting batch PDF generation:', error);
      return false;
    }
  }
};
