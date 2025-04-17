
import { useToast } from '@/hooks/utils/use-toast';
import { PDFGenerationOptions, PDFGenerationResult } from '@/lib/pdf/pdf.types';
import { batchGeneratePDFs, generatePDF as generatePDFService } from '@/lib/pdf/pdfServices';
import { pdfDatabaseService } from '@/services/pdf-service';
import { DocumentType } from '@/types/pdf.unified';
import { saveAs } from 'file-saver';
import { useState } from 'react';

/**
 * Hook for PDF operations including generation, storage, and downloading
 */
export const usePDF = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [isServerProcessing, setIsServerProcessing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  /**
   * Generates a PDF document
   */
  const generatePDF = async (
    documentType: DocumentType | string,
    documentId: string,
    options?: Partial<PDFGenerationOptions>
  ): Promise<PDFGenerationResult> => {
    setIsGenerating(true);

    try {
      const result = await generatePDFService(documentType, documentId, options);

      if (result.success && result.url) {
        setPdfUrl(result.url);

        // Download if requested
        if (options?.download && result.url) {
          await downloadPDF(result.url, options?.filename || `document_${documentId}.pdf`);
        }

        toast({
          title: 'PDF Generated',
          description: 'The PDF has been successfully generated.',
        });
      } else {
        throw new Error(result.error || 'Failed to generate PDF');
      }

      return result;
    } catch (error) {
      console.error('Error generating PDF:', error);

      toast({
        title: 'PDF Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        documentType: documentType as DocumentType,
        documentId
      };
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Batch generates PDFs for multiple documents
   */
  const batchGeneratePDF = async (
    documentType: DocumentType | string,
    documentId: string
  ): Promise<boolean> => {
    setIsServerProcessing(true);

    try {
      const result = await pdfDatabaseService.generatePDF(documentType, documentId, {
        forceRegenerate: true
      });

      if (result.success) {
        toast({
          title: 'PDF Generation Queued',
          description: 'The PDF is being generated on the server.',
        });

        if (result.url) {
          setPdfUrl(result.url);
        }

        return true;
      } else {
        throw new Error(result.error || 'Failed to queue PDF generation');
      }
    } catch (error) {
      console.error('Error queuing PDF generation:', error);

      toast({
        title: 'PDF Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });

      return false;
    } finally {
      setIsServerProcessing(false);
    }
  };

  /**
   * Stores a PDF on the server
   */
  const storePDF = async (
    documentType: DocumentType | string,
    documentId: string
  ): Promise<PDFGenerationResult> => {
    setIsStoring(true);

    try {
      // Try to retry if it's a failed PDF
      await pdfDatabaseService.retryFailedPDF(documentType, documentId);

      // Generate with server storage option
      const result = await pdfDatabaseService.generatePDF(documentType, documentId, {
        forceRegenerate: true
      });

      if (result.success) {
        toast({
          title: 'PDF Stored Successfully',
          description: 'The PDF has been generated and stored on the server.',
        });

        if (result.url) {
          setPdfUrl(result.url);
        }
      } else {
        throw new Error(result.error || 'Failed to store PDF');
      }

      return result;
    } catch (error) {
      console.error('Error storing PDF:', error);

      toast({
        title: 'PDF Storage Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        documentType: documentType as DocumentType,
        documentId
      };
    } finally {
      setIsStoring(false);
    }
  };

  /**
   * Downloads a PDF from a URL
   */
  const downloadPDF = async (url: string, fileName: string): Promise<void> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      saveAs(blob, fileName);

      toast({
        title: 'PDF Downloaded',
        description: 'The PDF has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);

      toast({
        title: 'PDF Download Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });

      throw error;
    }
  };

  return {
    pdfUrl,
    setPdfUrl,
    isGenerating,
    isStoring,
    isServerProcessing,
    generatePDF,
    batchGeneratePDF,
    batchGenerateMultiplePDFs: batchGeneratePDFs, // Re-export from service
    storePDF,
    downloadPDF
  };
};
