import React from 'react';
import { ButtonProps } from '@/components/ui/button';
import { StandardPDFButton } from './StandardPDFButton';
import { DocumentType } from '@/types/pdf.unified';

/**
 * @deprecated Use StandardPDFButton instead.
 * This component is a wrapper around StandardPDFButton for backward compatibility.
 * It will be removed in a future update.
 */
interface PDFActionsProps {
  documentType: DocumentType | string;
  document: any;
  showLabels?: boolean;
  onPDFGenerated?: (url: string) => void;
}

export const PDFActions: React.FC<PDFActionsProps & ButtonProps> = ({
  documentType,
  document,
  showLabels = false,
  onPDFGenerated,
  children,
  ...rest
}) => {
  // Convert string document types to DocumentType enum if needed
  const normalizedDocType = typeof documentType === 'string' 
    ? documentType === 'invoice' 
      ? DocumentType.INVOICE 
      : documentType === 'purchaseOrder' 
        ? DocumentType.PURCHASE_ORDER 
        : documentType === 'estimate' 
          ? DocumentType.ESTIMATE 
          : documentType === 'product' 
            ? DocumentType.PRODUCT 
            : DocumentType.INVOICE
    : documentType;

  return (
    <StandardPDFButton
      documentType={normalizedDocType}
      documentId={document.id}
      document={document}
      showLabel={showLabels}
      onPDFGenerated={onPDFGenerated}
      useDropdown={true}
      {...rest}
    >
      {children}
    </StandardPDFButton>
  );
};
