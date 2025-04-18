import { useToast } from "@/hooks/utils/use-toast";
import {
  DocumentType,
  PDFGenerationOptions,
  PDFGenerationResult,
} from "@/types/pdf-types";
import { pdfService } from "@/services/pdf-service";

export function usePDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async (
    documentType: DocumentType,
    documentId: string,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> => {
    setIsGenerating(true);

    try {
      const result = await pdfService.generatePDF(
        documentType,
        documentId,
        options
      );

      if (result.success) {
        toast({
          title: "PDF Generated",
          description: "The PDF has been generated successfully.",
        });
      } else {
        toast({
          title: "PDF Generation Failed",
          description: result.error || "Failed to generate PDF",
        });
      }

      return result;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDF,
    isGenerating,
  };
}
