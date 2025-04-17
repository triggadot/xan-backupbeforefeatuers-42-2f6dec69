import React, { createContext, useContext, useState, ReactNode } from 'react';
import { generateAndStorePDF, updatePDFLinkInDatabase } from '@/lib/pdf-utils';
import { useToast } from '@/hooks/utils/use-toast';
import { DocumentType } from '@/types/pdf.unified';

interface PDFContextType {
  // PDF generation
  generatePDF: (documentType: "invoice" | "purchase_order" | "estimate" | "product", document: any, saveLocally?: boolean) => Promise<string | null>;
  updatePDFLink: (documentType: DocumentType, documentId: string, pdfUrl: string) => Promise<boolean>;
  
  // PDF viewing
  viewPDF: (pdfUrl: string, documentType: DocumentType, document: any) => void;
  
  // PDF sharing
  sharePDF: (pdfUrl: string, documentType: DocumentType, document: any) => void;
  
  // PDF download
  downloadPDF: (pdfUrl: string) => void;
  
  // Loading state
  isLoading: boolean;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

interface PDFProviderProps {
  children: ReactNode;
}

export function PDFProvider({ children }: PDFProviderProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentPDF, setCurrentPDF] = useState<{
    url: string;
    documentType: DocumentType;
    document: any;
  } | null>(null);

  // Generate a PDF for a document
  const generatePDF = async (
    documentType: "invoice" | "purchase_order" | "estimate" | "product",
    document: any,
    saveLocally = false
  ): Promise<string | null> => {
    setIsLoading(true);
    
    try {
      const pdfUrl = await generateAndStorePDF(documentType, document, saveLocally);
      
      if (pdfUrl) {
        toast({
          title: 'PDF Generated',
          description: 'The PDF has been successfully generated.',
        });
        return pdfUrl;
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'PDF Generation Failed',
        description: 'There was an error generating the PDF. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update the PDF link in the database
  const updatePDFLink = async (
    documentType: DocumentType,
    documentId: string,
    pdfUrl: string
  ): Promise<boolean> => {
    const tableMap: Record<DocumentType, string> = {
      [DocumentType.INVOICE]: 'gl_invoices',
      [DocumentType.PURCHASE_ORDER]: 'gl_purchase_orders',
      [DocumentType.ESTIMATE]: 'gl_estimates',
      [DocumentType.PRODUCT]: 'gl_products'
    };
    
    const table = tableMap[documentType];
    
    try {
      const success = await updatePDFLinkInDatabase(
        table as any,
        documentId,
        pdfUrl
      );
      
      return success;
    } catch (error) {
      console.error('Error updating PDF link:', error);
      return false;
    }
  };

  // View a PDF
  const viewPDF = (pdfUrl: string, documentType: DocumentType, document: any) => {
    setCurrentPDF({ url: pdfUrl, documentType, document });
    setShowPreviewModal(true);
  };

  // Share a PDF
  const sharePDF = (pdfUrl: string, documentType: DocumentType, document: any) => {
    setCurrentPDF({ url: pdfUrl, documentType, document });
    setShowShareModal(true);
  };

  // Download a PDF
  const downloadPDF = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank');
  };

  const value = {
    generatePDF,
    updatePDFLink,
    viewPDF,
    sharePDF,
    downloadPDF,
    isLoading,
  };

  return (
    <PDFContext.Provider value={value}>
      {children}
      
      {/* We would include modals here, but we're using the component-specific modals for now */}
    </PDFContext.Provider>
  );
}

// Custom hook to use the PDF context
export function usePDF() {
  const context = useContext(PDFContext);
  
  if (context === undefined) {
    throw new Error('usePDF must be used within a PDFProvider');
  }
  
  return context;
}
