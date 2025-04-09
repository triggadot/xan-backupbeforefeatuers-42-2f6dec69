import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { FileText, Download, Upload, Loader2, Share2 } from 'lucide-react';
import { usePDFOperations, DocumentType } from '@/hooks/pdf/usePDFOperations';
import { PDFPreviewModal } from './PDFPreviewModal';
import { PDFShareModal } from './PDFShareModal';
import { useToast } from '@/hooks/utils/use-toast';
import { PDFErrorType } from '@/lib/pdf/common';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { toast } = useToast();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  // Use our custom PDF operations hook
  const { 
    generatePDF,
    batchGeneratePDF,
    loading,
    isGenerating,
    isServerProcessing
  } = usePDFOperations();

  /**
   * Handle PDF generation based on document type (client-side)
   */
  const handleGeneratePDF = async (downloadFile: boolean = download) => {
    try {
      // Call the generatePDF function with the document type and ID
      const url = await generatePDF(
        documentType, 
        documentId, 
        downloadFile
      );
      
      // Handle the result
      if (url) {
        setPdfUrl(url);
        
        // Show preview if requested
        if (showPreview && !downloadFile) {
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
  
  /**
   * Handle server-side PDF generation (batch mode)
   */
  const handleServerGeneratePDF = async () => {
    try {
      const success = await batchGeneratePDF(documentType, documentId);
      
      if (success) {
        toast({
          title: 'PDF Generation Requested',
          description: 'The PDF is being generated on the server and will be stored for future access.',
        });
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess('server-generated'); // We don't have a URL from server generation
        }
      } else {
        // Show error toast
        toast({
          title: 'PDF Generation Request Failed',
          description: `Could not request server-side ${documentType} PDF generation. Please try again.`,
          variant: 'destructive',
        });
        
        // Call error callback if provided
        if (onError) {
          onError(new Error(`Failed to request ${documentType} PDF generation`));
        }
      }
    } catch (error) {
      console.error('Error in server-side PDF generation:', error);
      
      // Show error toast
      toast({
        title: 'PDF Generation Request Failed',
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
      invoice: 'PDF',
      purchaseOrder: 'PDF',
      estimate: 'PDF',
      product: 'PDF'
    };
    
    return labels[documentType] || 'PDF';
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

  // Render dropdown for multiple options
  if (useDropdown) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={className}
              disabled={loading}
              {...props}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {getButtonLabel()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleGeneratePDF(true)}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleGeneratePDF(false)}>
              <FileText className="h-4 w-4 mr-2" />
              View PDF
            </DropdownMenuItem>
            
            {allowServerGeneration && (
              <DropdownMenuItem onClick={handleServerGeneratePDF}>
                <Upload className="h-4 w-4 mr-2" />
                Generate & Store on Server
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {showPreviewModal && pdfUrl && (
          <PDFPreviewModal
            pdfUrl={pdfUrl}
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            title={getModalTitle()}
            onShare={handleShare}
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

  // Render simple button for single action
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleGeneratePDF()}
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
          onShare={handleShare}
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
