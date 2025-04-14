/**
 * @file usePDF.ts
 * React hook for PDF operations using the standardized PDF service.
 */

import { useState } from 'react';
import { useToast } from '@/hooks/utils/use-toast';
import { generatePDF, batchGeneratePDFs } from '@/lib/pdf/pdf.service';
import { PDFGenerationOptions, PDFGenerationResult } from '@/lib/pdf/pdf.types';
import { DocumentType } from '@/types/pdf.unified';

/**
 * Hook for PDF operations including generation, batch generation, and downloading
 */
export function usePDF() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  
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
  
  return {
    generatePDF: generateDocumentPDF,
    batchGeneratePDFs: batchGenerateDocumentPDFs,
    isGenerating,
    isBatchGenerating,
  };
}
