import { useState } from 'react';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/utils/use-toast';
import { generateAndStoreInvoicePDF } from '@/lib/pdf/invoice-pdf';
import { generateAndStoreEstimatePDF } from '@/lib/pdf/estimate-pdf';
import { generateAndStorePurchaseOrderPDF } from '@/lib/pdf/purchase-order-pdf';
import { generateAndStoreProductPDF } from '@/lib/pdf/product-pdf';
import { PDFOperationResult } from '@/lib/pdf/common';

export type DocumentType = 'invoice' | 'purchaseOrder' | 'estimate' | 'product';

/**
 * Hook for PDF operations including generation, storage, and downloading
 * 
 * @returns Object containing PDF operation functions and loading states
 */
export const usePDFOperations = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStoring, setIsStoring] = useState(false);

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
      setIsStoring(false);
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

  return {
    generatePDF,
    downloadPDF,
    isGenerating,
    isStoring
  };
}
