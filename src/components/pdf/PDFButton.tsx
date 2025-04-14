import React from 'react';
import { ButtonProps } from '@/components/ui/button';
import { StandardPDFButton } from './StandardPDFButton';
import { DocumentType as UnifiedDocumentType, LegacyDocumentTypeString } from '@/types/pdf.unified';

/**
 * @deprecated Use LegacyDocumentTypeString from pdf.unified.ts instead
 */
export type DocumentType = LegacyDocumentTypeString;

interface PDFButtonProps extends Omit<ButtonProps, 'onClick'> {
  documentType: LegacyDocumentTypeString;
  document: any; // The document data (invoice, purchase order, or estimate)
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  action?: 'view' | 'share' | 'download' | 'generate';
  onPDFGenerated?: (pdfUrl: string) => void;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

/**
 * Unified PDF button component for viewing, sharing, downloading, or generating PDFs
 * @deprecated Use StandardPDFButton instead. This component will be removed in a future update.
 * StandardPDFButton provides a more consistent API and better error handling.
 */
export function PDFButton({
  documentType,
  document,
  variant = 'outline',
  size = 'default',
  action = 'view',
  onPDFGenerated,
  disabled = false,
  showLabel = true,
  className = '',
  ...props
}: PDFButtonProps) {
  // Log deprecation warning in development
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'PDFButton is deprecated. Please use StandardPDFButton from @/components/pdf/StandardPDFButton instead. ' +
        'This component will be removed in a future update.'
      );
    }
  }, []);

  // Convert legacy document type to new DocumentType enum
  const convertedDocumentType = (() => {
    switch (documentType) {
      case 'invoice': return UnifiedDocumentType.INVOICE;
      case 'estimate': return UnifiedDocumentType.ESTIMATE;
      case 'purchase-order': 
      case 'purchase_order': 
      case 'purchaseOrder': 
        return UnifiedDocumentType.PURCHASE_ORDER;
      default: return UnifiedDocumentType.INVOICE;
    }
  })();

  // Convert legacy action to new action type
  const convertedAction = (() => {
    switch (action) {
      case 'view': return 'view';
      case 'share': return 'share';
      case 'download': return 'download';
      case 'generate': return 'regenerate';
      default: return 'view';
    }
  })();

  // Extract document ID from the document object
  const documentId = document?.id || document?.glide_row_id || '';

  // Render the StandardPDFButton with converted props
  return (
    <StandardPDFButton
      documentType={convertedDocumentType}
      documentId={documentId}
      document={document}
      variant={variant}
      size={size}
      action={convertedAction}
      onPDFGenerated={onPDFGenerated}
      disabled={disabled}
      showLabel={showLabel}
      className={className}
      {...props}
    />
  );
}
