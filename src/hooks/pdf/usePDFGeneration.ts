
import { useToast } from '@/hooks/utils/use-toast';
import { pdfService } from '@/services/PDFServices';
import { DocumentType, PDFGenerationOptions, PDFGenerationResult } from '@/types/documents/pdf.unified';
import { useState } from 'react';

export function usePDFGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async (
    documentType: DocumentType | string,
    documentId: string,
    options?: Partial<PDFGenerationOptions>
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
          description: result.error || 'An error occurred while generating the PDF',
          variant: 'destructive'
        });
      }

      return result;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDF,
    isGenerating
  };
}
