import { supabase } from '@/integrations/supabase/client';
import { 
  PDFErrorType, 
  createPDFError, 
  createPDFFailure, 
  PDFOperationResult
} from './pdf/common';

/**
 * Interface for PDF storage response
 */
export interface StorePDFResponse {
  /** Whether the operation was successful */
  success: boolean;
  /** Public URL of the stored PDF (if successful) */
  url?: string;
  /** Success or error message */
  message: string;
}

/**
 * Interface for PDF storage request
 * @interface StorePDFRequest
 */
export interface StorePDFRequest {
  /** Type of document (invoice, purchase-order, or estimate) */
  documentType: 'invoice' | 'purchase-order' | 'estimate';
  /** Unique identifier of the document */
  documentId: string;
  /** Optional custom filename */
  fileName?: string;
  /** PDF content as base64 string */
  pdfBase64: string;
}

/**
 * Interface for PDF storage response
 * @interface StorePDFResponse
 */
export interface StorePDFResponse {
  /** Whether the operation was successful */
  success: boolean;
  /** Public URL of the stored PDF (if successful) */
  url?: string;
  /** Success or error message */
  message: string;
}

/**
 * Stores a PDF document using the Supabase edge function
 * 
 * @param blob - PDF blob to store
 * @param documentType - Type of document ('invoice', 'purchase-order', or 'estimate')
 * @param documentId - ID of the document
 * @param fileName - Optional custom filename
 * @returns Promise resolving to the storage operation result
 * 
 * @example
 * // Store an invoice PDF
 * const pdfBlob = await generatePDFDocument('invoice', invoiceData);
 * if (pdfBlob) {
 *   const result = await storePDF(pdfBlob, 'invoice', invoiceData.id);
 *   if (result.success) {
 *     console.log('PDF stored successfully:', result.url);
 *   }
 * }
 */
export async function storePDF(
  blob: Blob,
  documentType: 'invoice' | 'purchase-order' | 'estimate',
  documentId: string,
  fileName?: string
): Promise<StorePDFResponse> {
  // Default error response
  const errorResponse: StorePDFResponse = {
    success: false,
    message: 'Failed to store PDF'
  };

  if (!blob) {
    console.error('Invalid PDF blob provided to storePDF');
    return {
      ...errorResponse,
      message: 'Invalid PDF blob provided'
    };
  }

  if (!documentId) {
    console.error('Invalid document ID provided to storePDF');
    return {
      ...errorResponse,
      message: 'Invalid document ID provided'
    };
  }

  try {
    // Convert blob to base64
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Prepare request payload
    const payload: StorePDFRequest = {
      documentType,
      documentId,
      fileName,
      pdfBase64: base64
    };

    console.log(`Calling store-pdf edge function for ${documentType} with ID ${documentId}`);

    // Call the edge function with timeout handling
    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => {
      setTimeout(() => {
        resolve({
          data: null,
          error: new Error('Edge function request timed out after 15 seconds')
        });
      }, 15000); // 15 second timeout
    });

    // Call pdf-backend edge function instead of store-pdf
    const edgeFunctionPromise = supabase.functions.invoke('pdf-backend', {
      body: {
        action: 'generate',
        documentType: documentType,
        documentId: documentId,
        overwriteExisting: true
      }
    });

    // Race between the edge function call and the timeout
    const { data, error } = await Promise.race([edgeFunctionPromise, timeoutPromise]);

    if (error) {
      console.error('Error calling pdf-backend function:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }

    if (!data || !data.success) {
      const errorMessage = data?.error || 'Unknown error occurred during PDF generation';
      console.warn(`Edge function returned error: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage
      };
    }

    // Successfully generated and stored the PDF
    console.log(`PDF successfully generated for ${documentType} ${documentId}: ${data.url}`);
    return {
      success: true,
      url: data.url,
      message: 'PDF generated and stored successfully'
    };
  } catch (error) {
    console.error('Error in storePDF:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Updates the PDF URL in the database for a specific document
 * 
 * @param tableName - The table to update ('gl_invoices', 'gl_purchase_orders', or 'gl_estimates')
 * @param documentId - The ID of the document
 * @param pdfUrl - The URL of the stored PDF
 * @returns Promise resolving to whether the update was successful
 * 
 * @example
 * // Update the PDF URL for an invoice
 * const success = await updatePDFUrl('gl_invoices', '123', 'https://example.com/pdf.pdf');
 */
export async function updatePDFUrl(
  tableName: 'gl_invoices' | 'gl_purchase_orders' | 'gl_estimates',
  documentId: string,
  pdfUrl: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .update({ supabase_pdf_url: pdfUrl })
      .eq('id', documentId);

    if (error) {
      console.error(`Error updating PDF URL in ${tableName}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updatePDFUrl:', error);
    return false;
  }
}
