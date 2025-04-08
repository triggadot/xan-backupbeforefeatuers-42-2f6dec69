import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { FileText, Share, Download, Loader2 } from 'lucide-react';
import { generateAndStorePDF } from '@/lib/pdf-utils';
import { PDFPreviewModal } from './PDFPreviewModal';
import { PDFShareModal } from './PDFShareModal';
import { useToast } from '@/hooks/utils/use-toast';

export type DocumentType = 'invoice' | 'purchaseOrder' | 'estimate';

interface PDFButtonProps extends Omit<ButtonProps, 'onClick'> {
  documentType: DocumentType;
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(document?.supabase_pdf_url || null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Get the appropriate icon based on the action
  const getIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    
    switch (action) {
      case 'view':
        return <FileText className="h-4 w-4" />;
      case 'share':
        return <Share className="h-4 w-4" />;
      case 'download':
        return <Download className="h-4 w-4" />;
      case 'generate':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get the appropriate label based on the action
  const getLabel = () => {
    if (!showLabel) return null;
    
    switch (action) {
      case 'view':
        return 'View PDF';
      case 'share':
        return 'Share PDF';
      case 'download':
        return 'Download PDF';
      case 'generate':
        return 'Generate PDF';
      default:
        return 'PDF';
    }
  };

  // Handle the button click based on the action
  const handleClick = async () => {
    // If the document doesn't have a PDF URL or we're regenerating, generate one
    if (!pdfUrl || action === 'generate') {
      setIsLoading(true);
      try {
        const url = await generateAndStorePDF(
          documentType,
          document,
          action === 'download' // Save locally if downloading
        );
        
        if (url) {
          setPdfUrl(url);
          
          // Call the onPDFGenerated callback if provided
          if (onPDFGenerated) {
            onPDFGenerated(url);
          }
          
          // Show success toast
          toast({
            title: 'PDF Generated',
            description: 'The PDF has been successfully generated.',
          });
          
          // Perform the action with the new PDF URL
          handleActionWithUrl(url);
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
      } finally {
        setIsLoading(false);
      }
    } else {
      // If we already have a PDF URL, perform the action directly
      handleActionWithUrl(pdfUrl);
    }
  };

  // Handle the action with an existing PDF URL
  const handleActionWithUrl = (url: string) => {
    switch (action) {
      case 'view':
        setShowPreviewModal(true);
        break;
      case 'share':
        setShowShareModal(true);
        break;
      case 'download':
        // Open the URL in a new tab for download
        window.open(url, '_blank');
        break;
      default:
        // For 'generate' action, we've already generated the PDF
        break;
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={className}
        {...props}
      >
        {getIcon()}
        {getLabel() && <span className="ml-2">{getLabel()}</span>}
      </Button>

      {/* PDF Preview Modal */}
      {showPreviewModal && pdfUrl && (
        <PDFPreviewModal
          pdfUrl={pdfUrl}
          documentType={documentType}
          document={document}
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {/* PDF Share Modal */}
      {showShareModal && pdfUrl && (
        <PDFShareModal
          pdfUrl={pdfUrl}
          documentType={documentType}
          document={document}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}
