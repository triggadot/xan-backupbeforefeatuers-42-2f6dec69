import { useState } from 'react';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/utils/use-toast';
import { triggerPDFGeneration } from '@/lib/pdf-utils';
import { PDFOperationResult } from '@/lib/pdf/common';
import { supabase } from '@/integrations/supabase/client';
import { 
  DocumentType,
  normalizeDocumentType,
  getBackendDocumentTypeKey,
  documentTypeConfig,
  toLegacyDocumentTypeString
} from '@/types/pdf.unified';

// Import legacy helpers for backward compatibility
import { 
  getBatchDocumentTypeKey, 
  getStorageDocumentTypeKey
} from '@/types/documents';

/**
 * Hook for PDF operations including generation, storage, and downloading
 * 
 * @deprecated Use usePDF from @/hooks/pdf/usePDF instead.
 * This hook will be removed in a future update. All new code should use the
 * standardized usePDF hook which provides a more consistent API and better error handling.
 * 
 * @returns Object containing PDF operation functions and loading states
 */
export const usePDFOperations = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [isServerProcessing, setIsServerProcessing] = useState(false);

  /**
   * Generates a PDF document based on the document type and data using the standardized pdf-backend
   * @param documentType The type of document (invoice, estimate, purchase_order)
   * @param documentId The document ID to generate the PDF from
   * @param downloadAfterGeneration Whether to download the PDF after generation
   * @returns The URL of the generated PDF or null if generation failed
   */
  const generatePDF = async (
    documentType: DocumentType | string,
    documentId: string,
    downloadAfterGeneration: boolean = false
  ): Promise<string | null> => {
    if (!documentId) {
      console.error('No document ID provided for PDF generation');
      return null;
    }

    setIsGenerating(true);

    try {
      // Standardize the document type using our unified normalizer
      const normalizedDocType = normalizeDocumentType(documentType);
      
      // Convert to legacy format for triggerPDFGeneration if needed
      // triggerPDFGeneration expects 'invoice', 'purchaseOrder', or 'estimate'
      const pdfType = toLegacyDocumentTypeString(normalizedDocType);
      
      // Fetch the document data to pass to triggerPDFGeneration
      let document = null;
      let fetchError = null;
      
      // Use specific table names to satisfy TypeScript
      if (normalizedDocType === DocumentType.INVOICE) {
        const result = await supabase
          .from('gl_invoices')
          .select('*')
          .eq('id', documentId)
          .single();
        document = result.data;
        fetchError = result.error;
      } else if (normalizedDocType === DocumentType.ESTIMATE) {
        const result = await supabase
          .from('gl_estimates')
          .select('*')
          .eq('id', documentId)
          .single();
        document = result.data;
        fetchError = result.error;
      } else if (normalizedDocType === DocumentType.PURCHASE_ORDER) {
        const result = await supabase
          .from('gl_purchase_orders')
          .select('*')
          .eq('id', documentId)
          .single();
        document = result.data;
        fetchError = result.error;
      }
      
      if (fetchError || !document) {
        throw new Error(`Failed to fetch ${normalizedDocType} data: ${fetchError?.message || 'Document not found'}`);
      }
      
      // Use the standardized triggerPDFGeneration function
      const url = await triggerPDFGeneration(
        pdfType as 'invoice' | 'purchaseOrder' | 'estimate', 
        document as any, 
        true
      );
      
      if (!url) {
        throw new Error(`Failed to generate ${normalizedDocType} PDF`);
      }
      
      // Download the PDF if requested
      if (downloadAfterGeneration && url) {
        const fileName = document?.invoice_uid || document?.estimate_uid || document?.purchase_order_uid || documentId;
        await downloadPDF(url, `${normalizedDocType}_${fileName}.pdf`);
      }

      toast({
        title: 'PDF Generated',
        description: 'The PDF has been successfully created.',
      });

      return url;
    } catch (error) {
      console.error(`Error generating ${documentType} PDF:`, 
        error instanceof Error 
          ? { message: error.message, stack: error.stack } 
          : String(error)
      );
      toast({
        title: 'PDF Generation Failed',
        description: error instanceof Error ? error.message : 'There was an error generating the PDF.',
        variant: 'destructive',
      });
      throw error; // Re-throw the error for the caller to handle
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Request server-side batch generation of PDFs using the standardized pdf-backend edge function
   * @param documentType The type of document (invoice, estimate, purchase_order)
   * @param documentId The document ID to generate the PDF from
   * @returns Promise resolving to a boolean indicating success
   */
  const batchGeneratePDF = async (
    documentType: DocumentType,
    documentId: string
  ): Promise<boolean> => {
    if (!documentId) {
      console.error('No document ID provided for batch PDF generation');
      return false;
    }

    setIsServerProcessing(true);

    try {
      // Convert our frontend document type to the proper backend format using standardized mapping
      // Using getBatchDocumentTypeKey ensures we send exactly what the backend expects
      const backendDocumentType = getBatchDocumentTypeKey(documentType);
      console.log(`Using batch document type key: ${backendDocumentType} for document type: ${documentType}`);

      // Call the new pdf-backend edge function with forceRegenerate flag
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          action: 'generate',
          documentType: backendDocumentType,
          documentId: documentId,
          forceRegenerate: true, // Always regenerate the PDF even if it exists
          overwriteExisting: true // Always overwrite existing files in storage
        }
      });

      if (error) {
        console.error('Error calling pdf-backend generation:', error);
        throw new Error(`Failed to generate PDF: ${error.message}`);
      }

      if (data?.error) {
        console.error('PDF backend returned error:', data.error);
        throw new Error(`PDF generation failed: ${data.error}`);
      }

      console.log('PDF generation response:', data);
      return true;
    } catch (error) {
      console.error(`Error requesting PDF generation for ${documentType}:`, 
        error instanceof Error 
          ? { message: error.message, stack: error.stack } 
          : String(error)
      );
      toast({
        title: 'PDF Generation Failed',
        description: error instanceof Error ? error.message : 'There was an error requesting PDF generation.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsServerProcessing(false);
    }
  };

  /**
   * Request batch generation of PDFs for multiple documents using the pdf-backend function
   * @param documentType The type of documents (invoice, purchaseOrder, estimate)
   * @param documentIds Array of document IDs to generate PDFs for
   * @returns Promise resolving to an object with success and failure counts
   */
  const batchGenerateMultiplePDFs = async (
    documentType: DocumentType,
    documentIds: string[]
  ): Promise<{ success: number; failed: number }> => {
    if (!documentIds.length) {
      console.error('No document IDs provided for batch PDF generation');
      return { success: 0, failed: 0 };
    }

    setIsServerProcessing(true);

    try {
      // Convert our frontend document type to the proper backend format using standardized mapping
      // Using getBatchDocumentTypeKey ensures we send exactly what the backend expects
      const backendDocumentType = getBatchDocumentTypeKey(documentType);
      console.log(`Using batch document type key: ${backendDocumentType} for document type: ${documentType}`);

      // Call the new pdf-backend edge function with batch processing
      // and force regeneration/overwrite settings
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          action: 'batch',  // Changed from 'generate-batch' to 'batch' to match the backend expectation
          items: documentIds.map(id => ({
            type: backendDocumentType,
            id: id
          })),
          forceRegenerate: true, // Always regenerate PDFs even if they exist
          overwriteExisting: true // Always overwrite existing files in storage
        }
      });

      if (error) {
        console.error('Error calling pdf-backend batch generation:', error);
        throw new Error(`Failed to batch generate PDFs: ${error.message}`);
      }

      if (data?.error) {
        console.error('PDF backend returned error:', data.error);
        throw new Error(`Batch PDF generation failed: ${data.error}`);
      }

      console.log('Batch PDF generation response:', data);
    
    // Enhanced logging to help debug response format issues
    if (data?.summary) {
      console.log('Summary data found:', data.summary);
    } else {
      console.log('No summary data found, looking for top-level success/failed counts');
    }
    
    // Check for both formats: nested in summary object (new format) or at top level (old format)
    return { 
      success: data?.summary?.success ?? data?.success ?? 0, 
      failed: data?.summary?.failed ?? data?.failed ?? 0 
    };
    } catch (error) {
      // Enhanced error logging with more context about the document type and request
    console.error(`Error requesting batch PDF generation for ${documentType} (${documentIds.length} items):`, 
      error instanceof Error 
        ? { message: error.message, stack: error.stack } 
        : String(error)
    );
    
    // Log additional debugging info to help diagnose invoice-specific issues
    if (documentType === 'invoice') {
      console.error('Invoice batch generation failed. This document type is experiencing specific issues.');
    }  
      toast({
        title: 'Batch PDF Generation Failed',
        description: error instanceof Error ? error.message : 'There was an error requesting batch PDF generation.',
        variant: 'destructive',
      });
      return { success: 0, failed: documentIds.length };
    } finally {
      setIsServerProcessing(false);
    }
  };

  /**
   * Downloads a PDF from a URL
   * @param url The URL of the PDF to download
   * @param fileName The name to save the file as
   */
  const downloadPDF = async (url: string, fileName: string): Promise<void> => {
    try {
      // Check if this is a blob URL (starts with blob:)
      if (url.startsWith('blob:')) {
        // For blob URLs, we need to fetch the blob and then save it
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        // Use FileSaver.js to save the file
        saveAs(blob, fileName);
      } else {
        // For regular URLs (http/https), fetch and save
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        // Use FileSaver.js to save the file
        saveAs(blob, fileName);
      }
      
      toast({
        title: 'PDF Downloaded',
        description: 'Your PDF has been downloaded successfully.',
      });
      
      console.log(`PDF downloaded successfully: ${fileName}`);
    } catch (error) {
      console.error('Error downloading PDF:', 
        error instanceof Error 
          ? { message: error.message, stack: error.stack } 
          : String(error)
      );
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'There was an error downloading the PDF.',
        variant: 'destructive',
      });
      throw new Error(`Error downloading PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * Store PDF in Supabase storage using the standardized pdf-backend function
   * @param documentType Type of document (invoice, estimate, purchase_order)
   * @param documentId The ID of the document
   * @param pdfBlob The PDF file as a Blob (optional - if null, will trigger server-side generation)
   * @returns URL of the stored PDF or null if storage fails
   */
  const storePDF = async (
    documentType: DocumentType,
    documentId: string,
    pdfBlob?: Blob | null
  ): Promise<string | null> => {
    setIsStoring(true);
    try {
      let base64Data: string | undefined;
      
      // If PDF blob is provided, convert it to base64
      if (pdfBlob) {
        const reader = new FileReader();
        reader.readAsDataURL(pdfBlob);
        
        base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1]; // Remove the data:application/pdf;base64, part
            resolve(base64);
          };
          reader.onerror = (error) => reject(error);
        });
      }

      // Use the standardized pdf-backend function
      const normalizedType = normalizeDocumentType(documentType);

      // Make sure to include the project_id for Glide sync pattern
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          type: normalizedType,
          id: documentId,
          pdf_base64: base64Data, // Optional - only if client-side generated PDF is provided
          project_id: 'swrfsullhirscyxqneay' // Explicit project ID as per Glide sync pattern
        }
      });
      
      if (error) {
        console.error('Error with PDF operation:', error);
        toast({
          title: 'PDF Operation Failed',
          description: 'The PDF operation could not be completed.',
          variant: 'destructive'
        });
        return null;
      }
      
      return data?.url || null;
    } catch (error) {
      console.error('Error with PDF operation:', error);
      return null;
    } finally {
      setIsStoring(false);
    }
  };

  /**
   * Legacy method with same name for backward compatibility
   * @param documentType The type of document (invoice, estimate, purchase_order)
   * @param documentId The document ID to generate the PDF from
   * @returns Promise resolving to a boolean indicating success
   * @deprecated This is kept for backward compatibility but now uses the standardized pdf-backend approach
   */
  const batchGeneratePDFOld = async (
    documentType: DocumentType,
    documentId: string
  ): Promise<boolean> => {
    console.warn('Using legacy batchGeneratePDFOld method - this will be removed in a future update');
    // Redirect to the standardized implementation
    return batchGeneratePDF(documentType, documentId);
  };

  return {
    generatePDF,
    batchGeneratePDF,
    batchGeneratePDFNew: batchGeneratePDF, // Alias for backward compatibility
    batchGeneratePDFOld, // Legacy method for backward compatibility
    batchGenerateMultiplePDFs,
    downloadPDF,
    storePDF,
    isGenerating,
    isStoring,
    isServerProcessing,
    loading: isGenerating || isStoring || isServerProcessing
  };
};
