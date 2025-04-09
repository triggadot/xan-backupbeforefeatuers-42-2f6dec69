
import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { usePDFOperations, DocumentType } from '@/hooks/pdf/usePDFOperations';
import { PDFPreviewModal } from './PDFPreviewModal';
import { PDFShareModal } from './PDFShareModal';
import { useToast } from '@/hooks/utils/use-toast';
import { PDFErrorType } from '@/lib/pdf/common';

interface PDFGenerationButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * The type of document to generate
   */
  documentType: DocumentType;
  
  /**
   * The ID of the document to generate
   */
  documentId: string;
  
  /**
   * Whether to download the PDF after generation
   */
  download?: boolean;
  
  /**
   * Whether to show the PDF in a preview modal after generation
   */
  showPreview?: boolean;
  
  /**
   * Callback function when PDF is successfully generated
   */
  onSuccess?: (pdfUrl: string) => void;
  
  /**
   * Callback function when PDF generation fails
   */
  onError?: (error: any) => void;
  
  /**
   * Whether to show a label next to the icon
   */
  showLabel?: boolean;
  
  /**
   * Custom class name for styling
   */
  className?: string;
}

/**
 * Enhanced PDF generation button component using the usePDFOperations hook
 */
export function PDFGenerationButton({
  documentType,
  documentId,
  download = false,
  showPreview = true,
  onSuccess,
  onError,
  showLabel = true,
  className = '',
  ...props
}: PDFGenerationButtonProps) {
  const { toast } = useToast();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  // Use our custom PDF operations hook
  const { 
    generatePDF,
    loading
  } = usePDFOperations();

  /**
   * Handle PDF generation based on document type
   */
  const handleGeneratePDF = async () => {
    try {
      // Call the generatePDF function with the document type and ID
      const url = await generatePDF(
        documentType, 
        documentId, 
        download
      );
      
      // Handle the result
      if (url) {
        setPdfUrl(url);
        
        // Show preview if requested
        if (showPreview) {
          setShowPreviewModal(true);
        }
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(url);
        }
      } else {
        // Show error toast
        toast({
          title: 'PDF Generation Failed',
          description: `Could not generate ${documentType} PDF. Please try again.`,
          variant: 'destructive',
        });
        
        // Call error callback if provided
        if (onError) {
          onError(new Error(`Failed to generate ${documentType} PDF`));
        }
      }
    } catch (error) {
      console.error('Error in PDF generation:', error);
      
      // Show error toast
      toast({
        title: 'PDF Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      }
    }
  };

  // Toggle sharing modal
  const handleShare = () => {
    if (pdfUrl) {
      setShowPreviewModal(false);
      setShowShareModal(true);
    }
  };

  // Get the appropriate button label based on document type
  const getButtonLabel = () => {
    if (!showLabel) return null;
    
    const labels: Record<DocumentType, string> = {
      invoice: 'Generate Invoice PDF',
      purchaseOrder: 'Generate Purchase Order PDF',
      estimate: 'Generate Estimate PDF',
      product: 'Generate Product PDF'
    };
    
    return labels[documentType] || 'Generate PDF';
  };

  const getModalTitle = () => {
    const titles: Record<DocumentType, string> = {
      invoice: 'Invoice PDF',
      purchaseOrder: 'Purchase Order PDF',
      estimate: 'Estimate PDF',
      product: 'Product PDF'
    };
    
    return titles[documentType] || 'Document PDF';
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGeneratePDF}
        disabled={loading}
        className={className}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        {getButtonLabel()}
      </Button>
      
      {showPreviewModal && pdfUrl && (
        <PDFPreviewModal
          pdfUrl={pdfUrl}
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={getModalTitle()}
        />
      )}

      {showShareModal && pdfUrl && (
        <PDFShareModal 
          pdfUrl={pdfUrl}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={getModalTitle()}
        />
      )}
    </>
  );
}
