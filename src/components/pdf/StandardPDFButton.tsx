/**
 * @file StandardPDFButton.tsx
 * Standardized PDF button component that uses the unified PDF service.
 */

import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { FileText, Share, Download, Loader2 } from 'lucide-react';
import { PDFPreviewModal } from './PDFPreviewModal';
import { PDFShareModal } from './PDFShareModal';
import { usePDF } from '@/hooks/pdf/usePDF';
import { DocumentType, toLegacyDocumentTypeString } from '@/types/pdf.unified';
import { PDFGenerationOptions } from '@/lib/pdf/pdf.types';

interface StandardPDFButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Document type (invoice, estimate, purchase_order) */
  documentType: DocumentType;
  /** Document ID */
  documentId: string;
  /** Document data (optional, for better filename generation) */
  document?: any;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Button action */
  action?: 'view' | 'share' | 'download' | 'generate';
  /** Callback when PDF is generated */
  onPDFGenerated?: (pdfUrl: string) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Additional CSS class */
  className?: string;
  /** PDF generation options */
  pdfOptions?: Partial<PDFGenerationOptions>;
}

/**
 * Standardized PDF button component for viewing, sharing, downloading, or generating PDFs
 */
export function StandardPDFButton({
  documentType,
  documentId,
  document,
  variant = 'outline',
  size = 'default',
  action = 'view',
  onPDFGenerated,
  disabled = false,
  showLabel = true,
  className = '',
  pdfOptions,
  ...props
}: StandardPDFButtonProps) {
  const { generatePDF, isGenerating } = usePDF();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showShare, setShowShare] = useState(false);
  
  // Get the appropriate icon based on the action
  const getIcon = () => {
    if (isGenerating) return <Loader2 className="h-4 w-4 animate-spin" />;
    
    switch (action) {
      case 'view': return <FileText className="h-4 w-4" />;
      case 'share': return <Share className="h-4 w-4" />;
      case 'download': return <Download className="h-4 w-4" />;
      case 'generate': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };
  
  // Get the appropriate label based on the action
  const getLabel = () => {
    if (isGenerating) return 'Generating...';
    
    switch (action) {
      case 'view': return 'View PDF';
      case 'share': return 'Share PDF';
      case 'download': return 'Download PDF';
      case 'generate': return 'Generate PDF';
      default: return 'PDF';
    }
  };
  
  // Handle button click based on the action
  const handleClick = async () => {
    // Always generate the PDF first
    const options = {
      ...pdfOptions,
      // Only set download to true if the action is download
      download: action === 'download',
      // Force regenerate if the action is generate
      forceRegenerate: action === 'generate' || pdfOptions?.forceRegenerate,
    };
    
    const result = await generatePDF(documentType, documentId, options);
    
    if (result.success && result.url) {
      setPdfUrl(result.url);
      
      if (onPDFGenerated) {
        onPDFGenerated(result.url);
      }
      
      // Handle the action
      switch (action) {
        case 'view':
          setShowPreview(true);
          break;
        case 'share':
          setShowShare(true);
          break;
        // Download is handled by the generatePDF function
        // Generate just updates the URL
        default:
          break;
      }
    }
  };
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={disabled || isGenerating}
        className={className}
        {...props}
      >
        {getIcon()}
        {showLabel && <span className="ml-2">{getLabel()}</span>}
      </Button>
      
      {/* PDF Preview Modal */}
      {showPreview && pdfUrl && (
        <PDFPreviewModal
          pdfUrl={pdfUrl}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          documentType={toLegacyDocumentTypeString(documentType)}
          document={document}
          title={`${documentType} ${documentId}`}
        />
      )}
      
      {/* PDF Share Modal */}
      {showShare && pdfUrl && (
        <PDFShareModal
          pdfUrl={pdfUrl}
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          documentType={toLegacyDocumentTypeString(documentType)}
          document={document}
          title={`${documentType} ${documentId}`}
        />
      )}
    </>
  );
}
