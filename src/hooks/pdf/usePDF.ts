/**
 * @file usePDF.ts
 * React hook for PDF operations using the standardized PDF service.
 * This is the primary hook for all PDF-related operations in the application.
 * It follows the PDF backend architecture standardization and uses the unified type system.
 */

import { useState } from 'react';
import { useToast } from '@/hooks/utils/use-toast';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';
import { generatePDF, batchGeneratePDFs } from '@/lib/pdf/pdf.service';
import { PDFGenerationOptions, PDFGenerationResult } from '@/lib/pdf/pdf.types';
import { 
  DocumentType, 
  normalizeDocumentType, 
  toLegacyDocumentTypeString,
  getBackendDocumentTypeKey,
  documentTypeConfig
} from '@/types/pdf.unified';

/**
 * Hook for PDF operations including generation, batch generation, downloading, and storage
 * This is the standardized hook that should be used for all PDF operations
 */
export function usePDF() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [isServerProcessing, setIsServerProcessing] = useState(false);
  
  /**
   * Fetches document data from the database based on document type and ID
   * 
   * @param documentType - The type of document
   * @param documentId - The document ID
   * @returns Promise resolving to the document data or null if not found
   */
  const fetchDocumentData = async (
    documentType: DocumentType | string,
    documentId: string
  ): Promise<Record<string, any> | null> => {
    if (!documentId) {
      console.error('No document ID provided for fetching');
      return null;
    }
    
    try {
      // Standardize the document type
      const normalizedType = normalizeDocumentType(documentType);
      
      // Get the table name from the document type config
      const tableName = documentTypeConfig[normalizedType].tableName;
      
      // Fetch the document data
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (error) {
        console.error(`Error fetching ${normalizedType} data:`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in fetchDocumentData:', error);
      return null;
    }
  };

  /**
   * Generates a PDF for a document
   * 
   * @param documentType - The type of document
   * @param documentId - The document ID
   * @param options - PDF generation options
   * @returns Promise resolving to the PDF generation result
   */
  const generateDocumentPDF = async (
    documentType: DocumentType | string,
    documentId: string,
    options?: Partial<PDFGenerationOptions>
  ): Promise<PDFGenerationResult> => {
    setIsGenerating(true);
    
    try {
      const result = await generatePDF(documentType, documentId, options);
      
      if (result.success) {
        toast({
          title: 'PDF Generated',
          description: 'The PDF has been successfully created.',
        });
      } else {
        toast({
          title: 'PDF Generation Failed',
          description: result.error || 'An error occurred while generating the PDF.',
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      
      toast({
        title: 'PDF Generation Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return {
        success: false,
        error: errorMessage,
        documentId,
        documentType: documentType as DocumentType,
      };
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Batch generates PDFs for multiple documents
   * 
   * @param documentType - The type of documents
   * @param documentIds - Array of document IDs
   * @param options - PDF generation options
   * @returns Promise resolving to an array of PDF generation results
   */
  const batchGenerateDocumentPDFs = async (
    documentType: DocumentType | string,
    documentIds: string[],
    options?: Partial<PDFGenerationOptions>
  ): Promise<PDFGenerationResult[]> => {
    if (!documentIds.length) {
      toast({
        title: 'No Documents Selected',
        description: 'Please select at least one document to generate PDFs.',
        variant: 'destructive',
      });
      
      return [];
    }
    
    setIsBatchGenerating(true);
    
    try {
      const results = await batchGeneratePDFs(documentType, documentIds, options);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      if (successCount > 0) {
        toast({
          title: 'PDF Generation Complete',
          description: `Successfully generated ${successCount} PDF${successCount !== 1 ? 's' : ''}${failureCount > 0 ? `, ${failureCount} failed` : ''}.`,
          variant: failureCount > 0 ? 'default' : 'default',
        });
      } else {
        toast({
          title: 'PDF Generation Failed',
          description: 'Failed to generate any PDFs. Please try again.',
          variant: 'destructive',
        });
      }
      
      return results;
    } catch (error) {
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      
      toast({
        title: 'PDF Generation Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return documentIds.map(id => ({
        success: false,
        error: errorMessage,
        documentId: id,
        documentType: documentType as DocumentType,
      }));
    } finally {
      setIsBatchGenerating(false);
    }
  };
  
  /**
   * Downloads a PDF from a URL
   * 
   * @param url - The URL of the PDF to download
   * @param fileName - The name to save the file as
   */
  const downloadPDF = async (url: string, fileName: string): Promise<void> => {
    try {
      // Fetch the PDF file
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      // Convert to blob
      const blob = await response.blob();
      
      // Use FileSaver.js to save the file
      saveAs(blob, fileName);
      
      toast({
        title: 'PDF Downloaded',
        description: 'Your PDF has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'There was an error downloading the PDF.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Store PDF in Supabase storage using the standardized pdf-backend function
   * 
   * @param documentType - Type of document (invoice, estimate, purchase_order)
   * @param documentId - The ID of the document
   * @param pdfBlob - The PDF file as a Blob (optional - if null, will trigger server-side generation)
   * @returns Promise resolving to the URL of the stored PDF or null if storage fails
   */
  const storePDF = async (
    documentType: DocumentType | string,
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
      toast({
        title: 'PDF Storage Failed',
        description: error instanceof Error ? error.message : 'There was an error storing the PDF.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsStoring(false);
    }
  };

  /**
   * Trigger server-side PDF generation using the standardized pdf-backend function
   * 
   * @param documentType - The type of document (invoice, estimate, purchase_order)
   * @param documentId - The document ID to generate the PDF for
   * @returns Promise resolving to a boolean indicating success
   */
  const triggerServerPDFGeneration = async (
    documentType: DocumentType | string,
    documentId: string
  ): Promise<boolean> => {
    setIsServerProcessing(true);
    
    try {
      const normalizedType = normalizeDocumentType(documentType);
      
      // Call the pdf-backend function with the appropriate parameters
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          type: normalizedType,
          id: documentId,
          project_id: 'swrfsullhirscyxqneay' // Explicit project ID as per Glide sync pattern
        }
      });
      
      if (error) {
        throw new Error(`PDF generation failed: ${error.message}`);
      }
      
      toast({
        title: 'PDF Generation Requested',
        description: 'The PDF generation has been queued on the server.',
      });
      
      return true;
    } catch (error) {
      console.error('Error triggering server PDF generation:', error);
      toast({
        title: 'PDF Generation Request Failed',
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
   * 
   * @param documentType - The type of documents (invoice, purchaseOrder, estimate)
   * @param documentIds - Array of document IDs to generate PDFs for
   * @returns Promise resolving to an object with success and failure counts
   */
  const batchGenerateMultiplePDFs = async (
    documentType: DocumentType | string,
    documentIds: string[]
  ): Promise<{ success: number; failed: number }> => {
    if (!documentIds.length) {
      toast({
        title: 'No Documents Selected',
        description: 'Please select at least one document to generate PDFs.',
        variant: 'destructive',
      });
      
      return { success: 0, failed: 0 };
    }
    
    setIsBatchGenerating(true);
    
    try {
      // Normalize the document type
      const normalizedType = normalizeDocumentType(documentType);
      
      // Call the pdf-backend function with the batch of document IDs
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          type: normalizedType,
          batch: true,
          ids: documentIds,
          project_id: 'swrfsullhirscyxqneay' // Explicit project ID as per Glide sync pattern
        }
      });
      
      if (error) {
        throw new Error(`Batch PDF generation failed: ${error.message}`);
      }
      
      // Extract success and failure counts from the response
      const successCount = data?.success || 0;
      const failedCount = data?.failed || 0;
      
      // Show appropriate toast message based on results
      if (successCount > 0) {
        toast({
          title: 'PDF Generation Requested',
          description: `${successCount} PDF${successCount !== 1 ? 's' : ''} queued for generation${failedCount > 0 ? `, ${failedCount} failed` : ''}.`,
          variant: failedCount > 0 ? 'default' : 'default',
        });
      } else {
        toast({
          title: 'PDF Generation Failed',
          description: 'Failed to queue any PDFs for generation.',
          variant: 'destructive',
        });
      }
      
      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('Error in batch PDF generation:', error);
      
      toast({
        title: 'Batch PDF Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
      
      return { success: 0, failed: documentIds.length };
    } finally {
      setIsBatchGenerating(false);
    }
  };

  /**
   * Legacy method for backward compatibility
   * @deprecated Use triggerServerPDFGeneration instead
   */
  const batchGeneratePDFOld = async (
    documentType: DocumentType | string,
    documentId: string
  ): Promise<boolean> => {
    console.warn('Using legacy batchGeneratePDFOld method - this will be removed in a future update');
    return triggerServerPDFGeneration(documentType, documentId);
  };

  /**
   * Check if a document has an existing PDF
   * 
   * @param documentType - The type of document
   * @param documentId - The document ID
   * @returns Promise resolving to the document data with PDF URL if it exists
   */
  const checkExistingPDF = async (
    documentType: DocumentType | string,
    documentId: string
  ): Promise<{ data: Record<string, any> | null; error: Error | null }> => {
    try {
      // Standardize the document type
      const normalizedType = normalizeDocumentType(documentType);
      
      // Get the table name from the document type config
      // For 'product' type, we'll use a specific table
      let tableName = '';
      if (documentType === 'product') {
        tableName = 'gl_products';
      } else {
        tableName = documentTypeConfig[normalizedType]?.tableName || '';
      }
      
      if (!tableName) {
        throw new Error(`Unknown document type: ${documentType}`);
      }
      
      // Fetch the document data
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error in checkExistingPDF:', error);
      return { data: null, error: error as Error };
    }
  };

  return {
    // Core PDF operations
    generatePDF: generateDocumentPDF,
    batchGeneratePDFs: batchGenerateDocumentPDFs,
    batchGenerateMultiplePDFs,
    downloadPDF,
    storePDF,
    triggerServerPDFGeneration,
    fetchDocumentData,
    checkExistingPDF,
    
    // Legacy methods for backward compatibility
    batchGeneratePDF: triggerServerPDFGeneration, // Alias for backward compatibility
    batchGeneratePDFNew: triggerServerPDFGeneration, // Alias for backward compatibility
    batchGeneratePDFOld, // Legacy method for backward compatibility
    
    // Status indicators
    isGenerating,
    isBatchGenerating,
    isStoring,
    isServerProcessing,
    loading: isGenerating || isBatchGenerating || isStoring || isServerProcessing
  };
}
