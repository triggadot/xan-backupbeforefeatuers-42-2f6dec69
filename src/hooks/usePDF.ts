
import { useState } from 'react';
import { useToast } from "@/hooks/utils/use-toast";
import { DocumentType, PDFGenerationOptions, PDFGenerationResult } from "@/types/pdf-types";
import { pdfService } from "@/services/pdf-service";

/**
 * Hook for PDF operations
 * Handles both client-side and server-side PDF generation
 * 
 * @returns Object containing PDF operation functions and loading states
 */
export function usePDF() {
  const [isGenerating, setIsGenerating] = useState(false);
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
      const result = await pdfService.generatePDF(documentType, documentId, options);
      
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
   * Download a PDF file
   * @param url - URL of the PDF to download
   * @param filename - Name to save the file as
   */
  const downloadPDF = async (url: string, filename?: string): Promise<void> => {
    try {
      // Use window.open for simplicity
      window.open(url, '_blank');
      
      toast({
        title: 'PDF Opened',
        description: 'The PDF has been opened in a new tab.'
      });
    } catch (error) {
      console.error('Error opening PDF:', error);
      
      toast({
        title: 'Failed to Open PDF',
        description: error instanceof Error ? error.message : 'Failed to open PDF',
        variant: 'destructive'
      });
    }
  };

  return {
    generatePDF,
    downloadPDF,
    isGenerating
  };
}
