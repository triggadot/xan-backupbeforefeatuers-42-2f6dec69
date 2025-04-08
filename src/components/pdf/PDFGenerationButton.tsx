import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { usePDFOperations, DocumentType } from '@/hooks/pdf/usePDFOperations';
import { PDFPreviewModal } from './PDFPreviewModal';
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
 * 
 * @example
 * // Generate an invoice PDF with preview
 * <PDFGenerationButton 
 *   documentType="invoice" 
 *   documentId="123" 
 *   showPreview={true} 
 *   onSuccess={(url) => console.log('PDF URL:', url)} 
 * />
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  // Use our custom PDF operations hook
  const { 
    generatePDF,
    isGenerating,
    isStoring
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

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGeneratePDF}
        disabled={isGenerating || isStoring}
        className={className}
        {...props}
      >
        {(isGenerating || isStoring) ? (
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
          title={`${documentType.charAt(0).toUpperCase() + documentType.slice(1)} PDF`}
        />
      )}
    </>
  );
}
