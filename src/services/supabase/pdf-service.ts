
import { supabase } from '@/integrations/supabase/client';
import { DocumentType, getBackendDocumentTypeKey } from '@/types/pdf.unified';
import { PDFGenerationOptions, PDFGenerationResult } from '@/lib/pdf/pdf.types';

/**
 * Service for interacting with the PDF database functions and edge functions
 */
export const pdfDatabaseService = {
  /**
   * Submit a document for PDF generation via the pdf-backend edge function
   */
  async generatePDF(
    documentType: DocumentType | string,
    documentId: string,
    options?: Partial<PDFGenerationOptions>
  ): Promise<PDFGenerationResult> {
    try {
      // Convert to the backend format
      const backendType = getBackendDocumentTypeKey(documentType);
      
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          action: 'generate',
          documentType: backendType,
          documentId,
          forceRegenerate: options?.forceRegenerate || false,
          projectId: options?.projectId || 'swrfsullhirscyxqneay' // Default project ID
        }
      });
      
      if (error) {
        console.error(`PDF generation failed:`, error);
        return { 
          success: false, 
          error: `Edge function error: ${error.message}`,
          documentType: documentType as DocumentType,
          documentId
        };
      }
      
      if (!data?.success) {
        console.error(`PDF generation failed:`, data?.error);
        return { 
          success: false, 
          error: data?.error || 'Unknown error in PDF generation',
          documentType: documentType as DocumentType,
          documentId
        };
      }
      
      return {
        success: true,
        url: data.url,
        documentType: documentType as DocumentType,
        documentId
      };
    } catch (error) {
      console.error(`Error in PDF generation:`, error);
      return { 
        success: false, 
        error: `Exception: ${error instanceof Error ? error.message : String(error)}`,
        documentType: documentType as DocumentType,
        documentId
      };
    }
  },
  
  /**
   * Check the status of PDF generation for a document
   */
  async checkPDFStatus(
    documentType: DocumentType | string,
    documentId: string
  ): Promise<{
    exists: boolean;
    url?: string;
    inQueue: boolean;
    queuePosition?: number;
    failedAttempts: number;
  }> {
    try {
      // Get document data from the appropriate table
      const backendType = getBackendDocumentTypeKey(documentType);
      let tableName = '';
      
      switch (backendType) {
        case 'invoices':
          tableName = 'gl_invoices';
          break;
        case 'purchase_orders':
          tableName = 'gl_purchase_orders';
          break;
        case 'estimates':
          tableName = 'gl_estimates';
          break;
        default:
          throw new Error(`Unsupported document type: ${backendType}`);
      }
      
      // Check if document has PDF URL
      const { data: document, error: docError } = await supabase
        .from(tableName)
        .select('supabase_pdf_url')
        .eq('id', documentId)
        .single();
        
      if (docError) {
        throw new Error(`Error fetching document: ${docError.message}`);
      }
      
      // Check if document is in queue
      const { data: queueItems, error: queueError } = await supabase
        .from('gl_pdf_generation_queue')
        .select('id, priority, attempts')
        .eq('document_type', backendType)
        .eq('document_id', documentId)
        .is('processed_at', null);
        
      if (queueError) {
        throw new Error(`Error checking queue: ${queueError.message}`);
      }
      
      // Check for failures
      const { data: failures, error: failureError } = await supabase
        .from('pdf_generation_failures')
        .select('retry_count')
        .eq('document_type', backendType)
        .eq('document_id', documentId)
        .is('resolved', false);
        
      if (failureError) {
        throw new Error(`Error checking failures: ${failureError.message}`);
      }
      
      return {
        exists: !!document?.supabase_pdf_url,
        url: document?.supabase_pdf_url,
        inQueue: queueItems && queueItems.length > 0,
        queuePosition: queueItems?.length ? 0 : undefined, // We don't track exact position
        failedAttempts: failures?.length ? failures[0].retry_count : 0
      };
    } catch (error) {
      console.error(`Error checking PDF status:`, error);
      return {
        exists: false,
        inQueue: false,
        failedAttempts: 0
      };
    }
  },
  
  /**
   * Get the full PDF generation history for a document
   */
  async getPDFGenerationHistory(
    documentType: DocumentType | string,
    documentId: string
  ): Promise<any[]> {
    try {
      const backendType = getBackendDocumentTypeKey(documentType);
      
      const { data, error } = await supabase
        .from('pdf_generation_logs')
        .select('*')
        .eq('document_type', backendType)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw new Error(`Error fetching PDF history: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error(`Error getting PDF history:`, error);
      return [];
    }
  },
  
  /**
   * Force a document to be reprocessed if it's in the failure table
   */
  async retryFailedPDF(
    documentType: DocumentType | string,
    documentId: string
  ): Promise<boolean> {
    try {
      const backendType = getBackendDocumentTypeKey(documentType);
      
      // Get the failure record
      const { data: failure, error: failureError } = await supabase
        .from('pdf_generation_failures')
        .select('id')
        .eq('document_type', backendType)
        .eq('document_id', documentId)
        .is('resolved', false)
        .single();
        
      if (failureError) {
        console.error(`Error finding failure record: ${failureError.message}`);
        return false;
      }
      
      if (!failure) {
        // No failure record found, add to queue directly
        const { error: queueError } = await supabase
          .from('gl_pdf_generation_queue')
          .insert({
            document_type: backendType,
            document_id: documentId,
            priority: true
          });
          
        if (queueError) {
          throw new Error(`Error adding to queue: ${queueError.message}`);
        }
        
        return true;
      }
      
      // Reset the failure record
      const { error: updateError } = await supabase
        .from('pdf_generation_failures')
        .update({
          retry_count: 0,
          next_attempt: new Date().toISOString(),
          last_attempt: new Date().toISOString()
        })
        .eq('id', failure.id);
        
      if (updateError) {
        throw new Error(`Error updating failure record: ${updateError.message}`);
      }
      
      // Add to queue with high priority
      const { error: queueError } = await supabase
        .from('gl_pdf_generation_queue')
        .insert({
          document_type: backendType,
          document_id: documentId,
          priority: true
        });
        
      if (queueError) {
        throw new Error(`Error adding to queue: ${queueError.message}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error retrying PDF:`, error);
      return false;
    }
  }
};
