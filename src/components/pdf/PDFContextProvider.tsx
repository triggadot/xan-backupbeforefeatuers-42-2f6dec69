
import { useToast } from "@/hooks/utils/use-toast";
import { PDFGenerationOptions, PDFGenerationResult, DocumentType, toLegacyDocumentTypeString } from "@/types/pdf-types";
import { pdfService } from "@/services/pdf-service";
import { saveAs } from "file-saver";
import React, { createContext, useContext, useState } from "react";

interface PDFContextType {
  pdfUrl: string | null;
  setPdfUrl: React.Dispatch<React.SetStateAction<string | null>>;
  isGenerating: boolean;
  isServerProcessing: boolean;
  generatePDF: (
    documentType: DocumentType | string,
    documentId: string,
    options?: Partial<PDFGenerationOptions>
  ) => Promise<PDFGenerationResult>;
  batchGeneratePDF: (
    documentType: DocumentType | string,
    documentId: string
  ) => Promise<boolean>;
  storePDF: (
    documentType: DocumentType | string,
    documentId: string
  ) => Promise<PDFGenerationResult>;
  downloadPDF: (url: string, fileName: string) => Promise<void>;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export const PDFProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isServerProcessing, setIsServerProcessing] = useState(false);
  const { toast } = useToast();

  const generatePDF = async (
    documentType: DocumentType | string,
    documentId: string,
    options?: Partial<PDFGenerationOptions>
  ): Promise<PDFGenerationResult> => {
    setIsGenerating(true);

    try {
      const result = await pdfService.generatePDF(
        documentType,
        documentId,
        options
      );

      if (result.success && result.url) {
        setPdfUrl(result.url);

        // Download if requested
        if (options?.download && result.url) {
          await downloadPDF(
            result.url,
            options?.filename ||
              `${toLegacyDocumentTypeString(documentType)}_${documentId}.pdf`
          );
        }

        toast({
          title: "PDF Generated",
          description: "The PDF has been successfully generated.",
        });
      } else {
        throw new Error(result.error || "Failed to generate PDF");
      }

      return result;
    } catch (error) {
      console.error("Error generating PDF:", error);

      toast({
        title: "PDF Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        documentType: documentType as DocumentType,
        documentId,
      };
    } finally {
      setIsGenerating(false);
    }
  };

  const batchGeneratePDF = async (
    documentType: DocumentType | string,
    documentId: string
  ): Promise<boolean> => {
    setIsServerProcessing(true);

    try {
      // Use the single document function, but it will trigger server-side processing
      const result = await pdfService.generatePDF(documentType, documentId, {
        forceRegenerate: true, // Force regeneration for better reliability
      });

      if (result.success) {
        toast({
          title: "PDF Generation Queued",
          description: "The PDF is being generated on the server.",
        });
      } else {
        throw new Error(result.error || "Failed to queue PDF generation");
      }

      return result.success;
    } catch (error) {
      console.error("Error queuing PDF generation:", error);

      toast({
        title: "PDF Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });

      return false;
    } finally {
      setIsServerProcessing(false);
    }
  };

  const storePDF = async (
    documentType: DocumentType | string,
    documentId: string
  ): Promise<PDFGenerationResult> => {
    setIsServerProcessing(true);

    try {
      // Generate with server storage option
      const result = await pdfService.generatePDF(documentType, documentId, {
        forceRegenerate: true, // Always generate fresh version when storing
      });

      if (result.success) {
        toast({
          title: "PDF Stored Successfully",
          description: "The PDF has been generated and stored on the server.",
        });
      } else {
        throw new Error(result.error || "Failed to store PDF");
      }

      return result;
    } catch (error) {
      console.error("Error storing PDF:", error);

      toast({
        title: "PDF Storage Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        documentType: documentType as DocumentType,
        documentId,
      };
    } finally {
      setIsServerProcessing(false);
    }
  };

  const downloadPDF = async (url: string, fileName: string): Promise<void> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      saveAs(blob, fileName);

      toast({
        title: "PDF Downloaded",
        description: "The PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);

      toast({
        title: "PDF Download Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });

      throw error;
    }
  };

  const value: PDFContextType = {
    pdfUrl,
    setPdfUrl,
    isGenerating,
    isServerProcessing,
    generatePDF,
    batchGeneratePDF,
    storePDF,
    downloadPDF,
  };

  return <PDFContext.Provider value={value}>{children}</PDFContext.Provider>;
};

export const usePDFContext = (): PDFContextType => {
  const context = useContext(PDFContext);
  if (!context) {
    throw new Error("usePDFContext must be used within a PDFProvider");
  }
  return context;
};
