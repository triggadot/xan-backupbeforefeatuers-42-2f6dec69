
import { useState } from 'react';
import { useToast } from '@/hooks/utils/use-toast';
import { DocumentType, PDFGenerationOptions, PDFGenerationResult } from '@/types/pdf-types';
import { pdfService } from '@/services/pdf-service';

/**
 * Hook for PDF operations including generation, storage, and downloading
 * 
 * @returns Object containing PDF operation functions and loading states
 */
export function usePDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [isServerProcessing, setIsServerProcessing] = useState(false);
  const { toast } = useToast();

  /**
   * Generate a PDF document
   * @param documentType - Type of document (invoice, estimate, purchase_order)
   * @param documentId - ID of the document
   * @param options - Options for PDF generation
   * @returns Promise resolving to a PDFGenerationResult
   */
  const generatePDF = async (
    documentType: DocumentType | string,
    documentId: string,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> => {
    setIsGenerating(true);

    try {
      const result = await pdfService.generatePDF(documentType as DocumentType, documentId, options);
      
      if (result.success) {
        toast({
          title: 'PDF Generated',
          description: 'The PDF has been generated successfully.'
        });
      } else {
        toast({
          title: 'PDF Generation Failed',
          description: result.error || 'Failed to generate PDF',
          variant: 'destructive'
        });
      }

      return result;
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: 'PDF Generation Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return {
        success: false,
        error: errorMessage,
        documentId,
        documentType: documentType as DocumentType
      };
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Store a PDF on the server using edge function
   * @param documentType - Type of document
   * @param documentId - ID of the document
   * @returns Promise resolving to a PDFGenerationResult
   */
  const storePDF = async (
    documentType: DocumentType | string,
    documentId: string
  ): Promise<PDFGenerationResult> => {
    setIsStoring(true);

    try {
      const result = await pdfService.generatePDF(
        documentType as DocumentType,
        documentId,
        { forceRegenerate: true }
      );

      if (result.success) {
        // Update the document with the new PDF URL if available
        if (result.url) {
          await pdfService.updatePdfUrl(
            documentType as DocumentType,
            documentId,
            result.url
          );
        }

        toast({
          title: 'PDF Stored',
          description: 'The PDF has been stored successfully.'
        });
      } else {
        toast({
          title: 'PDF Storage Failed',
          description: result.error || 'Failed to store PDF',
          variant: 'destructive'
        });
      }

      return result;
    } catch (error) {
      console.error('Error storing PDF:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: 'PDF Storage Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return {
        success: false,
        error: errorMessage,
        documentId,
        documentType: documentType as DocumentType
      };
    } finally {
      setIsStoring(false);
    }
  };

  /**
   * Generate PDFs in batch on the server
   * @param documentType - Type of documents
   * @param documentId - ID of document to process
   * @returns Promise resolving to boolean indicating success
   */
  const batchGeneratePDF = async (
    documentType: DocumentType | string,
    documentId: string
  ): Promise<boolean> => {
    setIsServerProcessing(true);

    try {
      const result = await pdfService.batchGeneratePDF(documentType as DocumentType, documentId);
      
      if (result) {
        toast({
          title: 'Batch PDF Generation Started',
          description: 'The PDF generation has been queued on the server.'
        });
      } else {
        toast({
          title: 'Batch PDF Generation Failed',
          description: 'Failed to start batch PDF generation',
          variant: 'destructive'
        });
      }

      return result;
    } catch (error) {
      console.error('Error with batch PDF generation:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: 'Batch PDF Generation Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsServerProcessing(false);
    }
  };

  /**
   * Download a PDF file
   * @param url - URL of the PDF to download
   * @param filename - Name to save the file as
   */
  const downloadPDF = async (url: string, filename: string): Promise<void> => {
    try {
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download PDF',
        variant: 'destructive'
      });
    }
  };

  return {
    generatePDF,
    storePDF,
    batchGeneratePDF,
    downloadPDF,
    isGenerating,
    isStoring,
    isServerProcessing,
    loading: isGenerating || isStoring || isServerProcessing
  };
}
