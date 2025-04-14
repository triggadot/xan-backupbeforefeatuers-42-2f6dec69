import React from 'react';
import { ButtonProps } from '@/components/ui/button';
import { StandardPDFButton } from './StandardPDFButton';
import { DocumentType as UnifiedDocumentType } from '@/types/pdf.unified';
import { usePDFOperations } from '@/hooks/pdf/usePDFOperations';

interface PDFGenerationButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * The type of document to generate
   */
  documentType: 'invoice' | 'estimate' | 'purchaseOrder' | 'product';
  
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
  
  /**
   * Whether to use dropdown menu for different options
   */
  useDropdown?: boolean;
  
  /**
   * Whether to use server-side generation (batch mode)
   */
  allowServerGeneration?: boolean;
}

/**
 * Enhanced PDF generation button component supporting both client-side and server-side generation
 * @deprecated Use StandardPDFButton instead. This component will be removed in a future update.
 * StandardPDFButton provides a more consistent API and better error handling.
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
  useDropdown = true,
  allowServerGeneration = true,
  ...props
}: PDFGenerationButtonProps) {
  // Log deprecation warning in development
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'PDFGenerationButton is deprecated. Please use StandardPDFButton from @/components/pdf/StandardPDFButton instead. ' +
        'This component will be removed in a future update.'
      );
    }
  }, []);

  // Convert legacy document type to new DocumentType enum
  const convertedDocumentType = (() => {
    switch (documentType) {
      case 'invoice': return UnifiedDocumentType.INVOICE;
      case 'estimate': return UnifiedDocumentType.ESTIMATE;
      case 'purchaseOrder': return UnifiedDocumentType.PURCHASE_ORDER;
      case 'product': return UnifiedDocumentType.INVOICE; // Default to invoice for product type
      default: return UnifiedDocumentType.INVOICE;
    }
  })();

  // Determine the appropriate action based on parameters
  const action = download ? 'download' : (showPreview ? 'view' : 'generate');
  
  // Return the StandardPDFButton with converted props
  return (
    <StandardPDFButton
      documentType={convertedDocumentType}
      documentId={documentId}
      variant="outline"
      size="sm"
      action={action}
      onPDFGenerated={onSuccess}
      onError={onError}
      disabled={false}
      showLabel={showLabel}
      className={className}
      useDropdown={useDropdown}
      allowServerGeneration={allowServerGeneration}
      {...props}
    />
  );
}
