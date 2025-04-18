
import { supabase } from '@/integrations/supabase/client';
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
    documentType: DocumentType | string,
    documentId: string,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    try {
      // Normalize document type
      const normalizedType = this.normalizeDocumentType(documentType);
      
      // First, check if we already have a stored PDF URL and don't need to regenerate
      if (!options?.forceRegenerate) {
        const existingUrl = await this.getExistingPdfUrl(normalizedType, documentId);
        if (existingUrl) {
          return {
            success: true,
            url: existingUrl,
            documentId,
            documentType: normalizedType
          };
        }
      }

      // If we need to generate or regenerate, call the pdf-backend function
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          documentType: normalizedType,
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
          documentType: normalizedType
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
        documentType: typeof documentType === 'string' 
          ? this.normalizeDocumentType(documentType) 
          : documentType
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
   * Normalize document type to enum
   * @param documentType - Document type string or enum
   * @returns Normalized DocumentType enum value
   */
  normalizeDocumentType(documentType: DocumentType | string): DocumentType {
    if (typeof documentType === 'string') {
      switch (documentType.toLowerCase()) {
        case 'invoice':
          return DocumentType.INVOICE;
        case 'estimate':
          return DocumentType.ESTIMATE;
        case 'purchase_order':
        case 'purchaseorder':
        case 'purchase-order':
          return DocumentType.PURCHASE_ORDER;
        case 'product':
          return DocumentType.PRODUCT;
        default:
          throw new Error(`Invalid document type: ${documentType}`);
      }
    }
    return documentType;
  }
};
