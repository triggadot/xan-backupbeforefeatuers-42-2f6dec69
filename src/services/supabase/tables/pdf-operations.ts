import { supabase } from '@/integrations/supabase/client';
import { saveAs } from 'file-saver';
import { 
  DocumentType, 
  getBackendDocumentTypeKey, 
  getBatchDocumentTypeKey,
  getStorageDocumentTypeKey,
  normalizeDocumentType,
  toLegacyDocumentTypeString
} from '@/types/pdf.unified';
import { PDFOperationResult } from '@/lib/pdf/common';
import { triggerPDFGeneration } from '@/lib/pdf-utils';

/**
 * Type definitions for PDF operations
 */

export interface PDFGenerationParams {
  documentType: DocumentType | string;
  documentId: string;
  downloadAfterGeneration?: boolean;
  forceRegenerate?: boolean;
  overwriteExisting?: boolean;
}

export interface PDFBatchGenerationParams {
  documentType: DocumentType;
  documentIds: string[];
  forceRegenerate?: boolean;
  overwriteExisting?: boolean;
}

export interface PDFStorageParams {
  documentType: DocumentType;
  documentId: string;
  pdfBlob?: Blob | null;
}

export interface PDFGenerationResult {
  url: string | null;
  success: boolean;
  error?: string;
}

export interface PDFBatchResult {
  success: number;
  failed: number;
  errors?: string[];
}

export interface PDFFailureRecord {
  id: string;
  document_type: string;
  document_id: string;
  error_message: string;
  created_at: string;
  updated_at: string;
  attempts: number;
  status: 'pending' | 'processing' | 'failed' | 'resolved';
}

/**
 * Service for PDF operations
 * Handles generation, storage, and management of PDF documents
 */
export const pdfOperationsService = {
  /**
   * Generates a PDF document based on the document type and data
   * First tries client-side generation, falls back to server-side if needed
   */
  async generatePDF(params: PDFGenerationParams): Promise<PDFGenerationResult> {
    if (!params.documentId) {
      return {
        url: null,
        success: false,
        error: 'No document ID provided for PDF generation'
      };
    }

    try {
      // Check if we should use the server-side generation
      const useServerSide = this.shouldUseServerSideGeneration(params.documentType);
      
      if (useServerSide) {
        // Use the pdf-backend edge function
        return await this.generatePDFServerSide(params);
      } else {
        // Use client-side generation
        return await this.generatePDFClientSide(params);
      }
    } catch (error) {
      console.error(`Error generating PDF:`, error);
      
      return {
        url: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating PDF'
      };
    }
  },

  /**
   * Determines if server-side generation should be used based on document type
   * and environment preferences
   */
  shouldUseServerSideGeneration(documentType: DocumentType | string): boolean {
    // This function could decide based on document type, complexity, or configuration
    // For now, let's keep it simple:
    const normalizedType = normalizeDocumentType(documentType);
    
    // Purchase orders and larger documents are better generated server-side
    if (normalizedType === DocumentType.PURCHASE_ORDER) {
      return true;
    }
    
    // Check for an environment preference
    const preferServerSide = localStorage.getItem('preferServerSidePDFs') === 'true';
    if (preferServerSide) {
      return true;
    }
    
    // Default to client-side for now
    return false;
  },
  
  /**
   * Generate a PDF using the client-side generation logic
   */
  async generatePDFClientSide(params: PDFGenerationParams): Promise<PDFGenerationResult> {
    // Standardize the document type
    const normalizedDocType = normalizeDocumentType(params.documentType);
    
    // Convert to legacy format for triggerPDFGeneration
    const pdfType = toLegacyDocumentTypeString(normalizedDocType);
    
    // Fetch the document data
    let document = null;
    let fetchError = null;
    
    if (normalizedDocType === DocumentType.INVOICE) {
      const result = await supabase
        .from('gl_invoices')
        .select('*')
        .eq('id', params.documentId)
        .single();
      document = result.data;
      fetchError = result.error;
    } else if (normalizedDocType === DocumentType.ESTIMATE) {
      const result = await supabase
        .from('gl_estimates')
        .select('*')
        .eq('id', params.documentId)
        .single();
      document = result.data;
      fetchError = result.error;
    } else if (normalizedDocType === DocumentType.PURCHASE_ORDER) {
      const result = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('id', params.documentId)
        .single();
      document = result.data;
      fetchError = result.error;
    }
    
    if (fetchError || !document) {
      return {
        url: null,
        success: false,
        error: `Failed to fetch ${normalizedDocType} data: ${fetchError?.message || 'Document not found'}`
      };
    }
    
    // Generate the PDF
    const url = await triggerPDFGeneration(
      pdfType as 'invoice' | 'purchaseOrder' | 'estimate', 
      document as any, 
      true
    );
    
    if (!url) {
      return {
        url: null,
        success: false,
        error: `Failed to generate ${normalizedDocType} PDF`
      };
    }
    
    // Download the PDF if requested
    if (params.downloadAfterGeneration && url) {
      const fileName = document?.invoice_uid || document?.estimate_uid || document?.purchase_order_uid || params.documentId;
      await this.downloadPDF(url, `${normalizedDocType}_${fileName}.pdf`);
    }

    return {
      url,
      success: true
    };
  },
  
  /**
   * Generate a PDF using the server-side generation logic
   */
  async generatePDFServerSide(params: PDFGenerationParams): Promise<PDFGenerationResult> {
    const backendDocumentType = getBackendDocumentTypeKey(params.documentType);

    const { data, error } = await supabase.functions.invoke('pdf-backend', {
      body: {
        action: 'generate',
        documentType: backendDocumentType,
        documentId: params.documentId,
        forceRegenerate: params.forceRegenerate ?? false
      }
    });

    if (error) {
      return {
        url: null,
        success: false,
        error: `Server error generating PDF: ${error.message}`
      };
    }

    if (!data?.success || !data?.url) {
      return {
        url: null,
        success: false,
        error: data?.error || 'Server failed to generate PDF'
      };
    }
    
    // Download the PDF if requested
    if (params.downloadAfterGeneration && data.url) {
      const fileName = `${backendDocumentType}_${params.documentId}.pdf`;
      await this.downloadPDF(data.url, fileName);
    }

    return {
      url: data.url,
      success: true
    };
  },

  /**
   * Request server-side batch generation of PDFs
   */
  async batchGeneratePDF(params: PDFGenerationParams): Promise<boolean> {
    if (!params.documentId) {
      console.error('No document ID provided for batch PDF generation');
      return false;
    }

    try {
      // Get the correct document type key for the backend
      const backendDocumentType = getBatchDocumentTypeKey(params.documentType);

      // Call the pdf-backend edge function
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          action: 'generate',
          documentType: backendDocumentType,
          documentId: params.documentId,
          forceRegenerate: params.forceRegenerate ?? true,
          overwriteExisting: params.overwriteExisting ?? true
        }
      });

      if (error) {
        console.error('Error calling pdf-backend generation:', error);
        return false;
      }

      if (data?.error) {
        console.error('PDF backend returned error:', data.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error requesting PDF generation:`, error);
      return false;
    }
  },

  /**
   * Generate multiple PDFs in batch mode
   */
  async batchGenerateMultiplePDFs(params: PDFBatchGenerationParams): Promise<PDFBatchResult> {
    if (!params.documentIds || params.documentIds.length === 0) {
      return {
        success: 0,
        failed: 0,
        errors: ['No document IDs provided for batch PDF generation']
      };
    }

    try {
      // Get the correct document type key for the backend
      const backendDocumentType = getBatchDocumentTypeKey(params.documentType);
      
      // Call the pdf-backend edge function with multiple IDs
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          action: 'batch',
          documentType: backendDocumentType,
          documentIds: params.documentIds,
          forceRegenerate: params.forceRegenerate ?? true,
          overwriteExisting: params.overwriteExisting ?? true
        }
      });

      if (error) {
        console.error('Error calling batch pdf generation:', error);
        return {
          success: 0,
          failed: params.documentIds.length,
          errors: [error.message]
        };
      }

      if (data?.error) {
        console.error('PDF backend returned error:', data.error);
        return {
          success: 0,
          failed: params.documentIds.length,
          errors: [data.error]
        };
      }

      // Return the batch processing results
      return {
        success: data?.summary?.success || 0,
        failed: data?.summary?.failed || 0,
        errors: data?.errors
      };
    } catch (error) {
      console.error(`Error in batch PDF generation:`, error);
      
      return {
        success: 0,
        failed: params.documentIds.length,
        errors: [error instanceof Error ? error.message : 'Unknown error in batch generation']
      };
    }
  },

  /**
   * Download a PDF file from a URL
   */
  async downloadPDF(url: string, fileName: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  },

  /**
   * Store a PDF in Supabase Storage
   */
  async storePDF(params: PDFStorageParams): Promise<string | null> {
    if (!params.documentId) {
      console.error('No document ID provided for PDF storage');
      return null;
    }

    try {
      // Get the correct storage path for the document type
      const storageDocumentType = getStorageDocumentTypeKey(params.documentType);
      const filePath = `${storageDocumentType}/${params.documentId}.pdf`;
      
      let pdfBlob = params.pdfBlob;
      
      // If no blob is provided, generate one
      if (!pdfBlob) {
        const generationResult = await this.generatePDF({
          documentType: params.documentType,
          documentId: params.documentId
        });
        
        if (!generationResult.url || !generationResult.success) {
          throw new Error(generationResult.error || 'Failed to generate PDF for storage');
        }
        
        const response = await fetch(generationResult.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch generated PDF: ${response.statusText}`);
        }
        
        pdfBlob = await response.blob();
      }
      
      // Upload the PDF to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdf-documents')
        .upload(filePath, pdfBlob as Blob, {
          upsert: true,
          contentType: 'application/pdf'
        });
      
      if (uploadError) {
        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }
      
      // Get the public URL for the stored PDF
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-documents')
        .getPublicUrl(filePath);
      
      // Update the document record with the PDF URL
      const tableName = storageDocumentType === 'invoices' 
        ? 'gl_invoices' 
        : (storageDocumentType === 'estimates' 
          ? 'gl_estimates' 
          : 'gl_purchase_orders');
      
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ supabase_pdf_url: publicUrl })
        .eq('id', params.documentId);
      
      if (updateError) {
        console.error(`Warning: Failed to update ${tableName} with PDF URL:`, updateError);
        // Continue despite this error as the PDF was successfully stored
      }
      
      return publicUrl;
    } catch (error) {
      console.error(`Error storing PDF:`, error);
      return null;
    }
  },

  /**
   * Get PDF failures for a specific document type
   */
  async getPDFFailures(documentType?: string): Promise<PDFFailureRecord[]> {
    try {
      let query = supabase
        .from('pdf_generation_failures')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (documentType) {
        query = query.eq('document_type', documentType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch PDF failures: ${error.message}`);
      }
      
      return data as PDFFailureRecord[];
    } catch (error) {
      console.error('Error fetching PDF failures:', error);
      return [];
    }
  },

  /**
   * Retry a failed PDF generation
   */
  async retryPDFGeneration(failureId: string): Promise<boolean> {
    try {
      // Call the pdf-backend edge function to retry generation
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          action: 'retry-failure',
          failureId: failureId
        }
      });
      
      if (error) {
        throw new Error(`Failed to retry PDF generation: ${error.message}`);
      }
      
      if (data?.error) {
        throw new Error(`PDF backend retry failed: ${data.error}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error retrying PDF generation:', error);
      return false;
    }
  }
};
