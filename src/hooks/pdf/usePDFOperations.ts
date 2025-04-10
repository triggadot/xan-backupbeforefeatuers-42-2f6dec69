import { useState } from 'react';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/utils/use-toast';
import { generateAndStoreInvoicePDF } from '@/lib/pdf/invoice-pdf';
import { generateAndStoreEstimatePDF } from '@/lib/pdf/estimate-pdf';
import { generateAndStorePurchaseOrderPDF } from '@/lib/pdf/purchase-order-pdf';
import { generateAndStoreProductPDF } from '@/lib/pdf/product-pdf';
import { PDFOperationResult } from '@/lib/pdf/common';
import { supabase } from '@/integrations/supabase/client';
import { 
  DocumentType, 
  getBatchDocumentTypeKey, 
  getStorageDocumentTypeKey, 
  normalizeDocumentType 
} from '@/types/documents';

/**
 * Hook for PDF operations including generation, storage, and downloading
 * 
 * @returns Object containing PDF operation functions and loading states
 */
export const usePDFOperations = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [isServerProcessing, setIsServerProcessing] = useState(false);

  /**
   * Generates a PDF document based on the document type and data
   * @param documentType The type of document (invoice, purchaseOrder, estimate, product)
   * @param documentId The document ID to generate the PDF from
   * @param downloadAfterGeneration Whether to download the PDF after generation
   * @returns The URL of the generated PDF or null if generation failed
   */
  const generatePDF = async (
    documentType: DocumentType,
    documentId: string,
    downloadAfterGeneration: boolean = false
  ): Promise<string | null> => {
    if (!documentId) {
      console.error('No document ID provided for PDF generation');
      return null;
    }

    setIsGenerating(true);
    let result: PDFOperationResult | null = null;

    try {
      // Generate the PDF based on document type
      switch (documentType) {
        case 'invoice':
          result = await generateAndStoreInvoicePDF(documentId, downloadAfterGeneration);
          break;
        case 'purchaseOrder':
          result = await generateAndStorePurchaseOrderPDF(documentId, downloadAfterGeneration);
          break;
        case 'estimate':
          result = await generateAndStoreEstimatePDF(documentId, downloadAfterGeneration);
          break;
        case 'product':
          result = await generateAndStoreProductPDF(documentId, downloadAfterGeneration);
          break;
        default:
          throw new Error(`Unsupported document type: ${documentType}`);
      }

      if (!result.success || !result.url) {
        throw new Error(result.error?.message || `Failed to generate ${documentType} PDF`);
      }

      toast({
        title: 'PDF Generated',
        description: 'The PDF has been successfully created.',
      });

      return result.url;
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
   * Request server-side batch generation of PDFs using the new pdf-backend edge function
   * @param documentType The type of document (invoice, purchaseOrder, estimate)
   * @param documentId The document ID to generate the PDF from
   * @returns Promise resolving to a boolean indicating success
   */
  const batchGeneratePDFNew = async (
    documentType: DocumentType,
    documentId: string
  ): Promise<boolean> => {
    if (!documentId) {
      console.error('No document ID provided for batch PDF generation');
      return false;
    }

    setIsServerProcessing(true);

    try {
      // Convert our frontend document type to the backend document type
      const backendDocumentType = normalizeDocumentType(documentType);

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
      // Convert our frontend document type to the backend document type
      const backendDocumentType = normalizeDocumentType(documentType);

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
      return { 
        success: data?.success || 0, 
        failed: data?.failed || 0 
      };
    } catch (error) {
      console.error(`Error requesting batch PDF generation for ${documentType}:`, 
        error instanceof Error 
          ? { message: error.message, stack: error.stack } 
          : String(error)
      );
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
   * Store PDF in Supabase storage
   * @param documentType Type of document (invoice, purchaseOrder, estimate, product)
   * @param documentId The ID of the document
   * @param pdfBlob The PDF file as a Blob
   * @returns URL of the stored PDF or null if storage fails
   */
  const storePDF = async (
    documentType: DocumentType,
    documentId: string,
    pdfBlob: Blob
  ): Promise<string | null> => {
    setIsStoring(true);
    try {
      // Call our edge function to store the PDF
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1]; // Remove the data:application/pdf;base64, part
          resolve(base64);
        };
        reader.onerror = (error) => reject(error);
      });
      
      // Use the storage document type key from our standardized mapping
      const storageTypeKey = getStorageDocumentTypeKey(documentType);
      
      const { data, error } = await supabase.functions.invoke('store-pdf', {
        body: {
          documentType: storageTypeKey,
          documentId,
          pdfBase64: base64Data,
          fileName: `${documentType}_${documentId}.pdf`
        }
      });
      
      if (error) {
        console.error('Error storing PDF:', error);
        toast({
          title: 'Storage Failed',
          description: 'The PDF was generated but could not be stored on the server.',
          variant: 'destructive'
        });
        return null;
      }
      
      return data?.url || null;
    } catch (error) {
      console.error('Error storing PDF:', error);
      return null;
    } finally {
      setIsStoring(false);
    }
  };

  /**
   * Request server-side batch generation of PDFs using the legacy edge function
   * @param documentType The type of document (invoice, purchaseOrder, estimate, product)
   * @param documentId The document ID to generate the PDF from
   * @returns Promise resolving to a boolean indicating success
   * @deprecated Use batchGeneratePDFNew instead which utilizes the new pdf-backend function
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
      // Use the batch document type key from our standardized mapping
      const batchTypeKey = getBatchDocumentTypeKey(documentType);

      // Call the batch-generate-and-store-pdfs edge function
      const { data, error } = await supabase.functions.invoke('batch-generate-and-store-pdfs', {
        body: {
          items: [
            {
              id: documentId,
              type: batchTypeKey
            }
          ]
        }
      });

      if (error) {
        console.error('Error calling batch PDF generation:', error);
        throw new Error(`Failed to request batch generation: ${error.message}`);
      }

      console.log('Batch PDF generation response:', data);
      return true;
    } catch (error) {
      console.error(`Error requesting batch ${documentType} PDF generation:`, 
        error instanceof Error 
          ? { message: error.message, stack: error.stack } 
          : String(error)
      );
      toast({
        title: 'Batch PDF Request Failed',
        description: error instanceof Error ? error.message : 'There was an error requesting PDF generation.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsServerProcessing(false);
    }
  };

  return {
    generatePDF,
    batchGeneratePDF,
    batchGeneratePDFNew,
    batchGenerateMultiplePDFs,
    downloadPDF,
    storePDF,
    isGenerating,
    isStoring,
    isServerProcessing,
    loading: isGenerating || isStoring || isServerProcessing
  };
};
