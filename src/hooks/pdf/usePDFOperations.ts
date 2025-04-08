import { useState } from 'react';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/utils/use-toast';
import { 
  generateInvoicePDF, 
  generatePurchaseOrderPDF, 
  generateEstimatePDF,
  storePDFInSupabase,
  generateFilename,
  generateAndStorePDF
} from '@/lib/pdf-utils';
import { jsPDF } from 'jspdf';

export type DocumentType = 'invoice' | 'purchaseOrder' | 'estimate';

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
   * @param documentType The type of document (invoice, purchaseOrder, estimate)
   * @param document The document data to generate the PDF from
   * @param downloadAfterGeneration Whether to download the PDF after generation
   * @returns The URL of the generated PDF or null if generation failed
   */
  const generatePDF = async (
    documentType: DocumentType,
    document: any,
    downloadAfterGeneration: boolean = false
  ): Promise<string | null> => {
    if (!document) {
      console.error('No document provided for PDF generation');
      return null;
    }

    setIsGenerating(true);
    let pdfUrl = null;
    let pdfDoc: jsPDF | null = null;
    let filename = '';

    try {
      // Generate the PDF based on document type
      switch (documentType) {
        case 'invoice':
          pdfDoc = generateInvoicePDF(document);
          filename = generateFilename(
            'Invoice',
            document.invoice_uid?.replace(/^INV#/, '') || document.id,
            document.invoice_order_date || new Date()
          );
          break;
        case 'purchaseOrder':
          pdfDoc = generatePurchaseOrderPDF(document);
          filename = generateFilename(
            'PO',
            document.purchase_order_uid?.replace(/^PO#/, '') || document.id,
            document.po_date || new Date()
          );
          break;
        case 'estimate':
          pdfDoc = generateEstimatePDF(document);
          filename = generateFilename(
            'Estimate',
            document.estimate_uid || document.id,
            document.created_at || new Date()
          );
          break;
        default:
          throw new Error(`Unsupported document type: ${documentType}`);
      }

      if (!pdfDoc) {
        throw new Error(`Failed to generate ${documentType} PDF`);
      }

      // Store the PDF in Supabase and get the URL
      setIsStoring(true);
      const entityType = documentType === 'purchaseOrder' ? 'purchase-order' : documentType;
      pdfUrl = await generateAndStorePDF(documentType, document, downloadAfterGeneration);

      if (!pdfUrl) {
        throw new Error(`Failed to store ${documentType} PDF`);
      }

      // Download the PDF if requested
      if (downloadAfterGeneration) {
        await downloadPDF(pdfUrl, filename);
      }

      toast({
        title: 'PDF Generated',
        description: 'The PDF has been successfully created.',
      });

      return pdfUrl;
    } catch (error) {
      console.error(`Error generating ${documentType} PDF:`, error);
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
      // Fetch the PDF data from the URL
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Use FileSaver.js to save the file
      saveAs(blob, fileName);
      
      toast({
        title: 'PDF Downloaded',
        description: 'Your PDF has been downloaded successfully.',
      });
      
      console.log(`PDF downloaded successfully: ${fileName}`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
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
