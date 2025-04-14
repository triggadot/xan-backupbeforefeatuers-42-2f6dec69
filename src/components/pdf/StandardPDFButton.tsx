/**
 * @file StandardPDFButton.tsx
 * Standardized PDF button component that uses the unified PDF service.
 * This is the primary PDF button component for all PDF operations in the application.
 * It follows the PDF backend architecture standardization and uses the unified type system.
 * 
 * This component replaces all legacy PDF button components and provides a unified interface
 * for all PDF operations including viewing, sharing, downloading, generating, and server-side
 * generation using the pdf-backend edge function.
 */

import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { FileText, Share, Download, Loader2, Upload, RefreshCw } from 'lucide-react';
import { PDFPreviewModal } from './PDFPreviewModal';
import { PDFShareModal } from './PDFShareModal';
import { usePDF } from '@/hooks/pdf/usePDF';
import { DocumentType, toLegacyDocumentTypeString } from '@/types/pdf.unified';
import { PDFGenerationOptions } from '@/lib/pdf/pdf.types';
import { useToast } from '@/hooks/utils/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StandardPDFButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Document type (invoice, estimate, purchase_order) */
  documentType: DocumentType;
  /** Document ID */
  documentId: string;
  /** Document data (optional, for better filename generation) */
  document?: any;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Button action */
  action?: 'view' | 'share' | 'download' | 'generate' | 'server' | 'regenerate';
  /** Callback when PDF is generated */
  onPDFGenerated?: (pdfUrl: string) => void;
  /** Callback when an error occurs */
  onError?: (error: any) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Additional CSS class */
  className?: string;
  /** PDF generation options */
  pdfOptions?: Partial<PDFGenerationOptions>;
  /** Whether to use a dropdown menu for multiple options */
  useDropdown?: boolean;
  /** Whether to allow server-side generation */
  allowServerGeneration?: boolean;
  /** Custom title for modals */
  title?: string;
  /** Whether to show a share button in the preview modal */
  showShareOption?: boolean;
  /** Whether to force regeneration of the PDF */
  forceRegenerate?: boolean;
  /** Whether to use batch processing for server-side generation */
  useBatchProcessing?: boolean;
}

/**
 * Standardized PDF button component for viewing, sharing, downloading, or generating PDFs
 * This is the primary component for all PDF operations in the application.
 */
export function StandardPDFButton({
  documentType,
  documentId,
  document,
  variant = 'outline',
  size = 'default',
  action = 'view',
  onPDFGenerated,
  onError,
  disabled = false,
  showLabel = true,
  className = '',
  pdfOptions,
  useDropdown = false,
  allowServerGeneration = true,
  title,
  showShareOption = true,
  forceRegenerate = false,
  useBatchProcessing = false,
  ...props
}: StandardPDFButtonProps) {
  const { 
    generatePDF, 
    batchGeneratePDF, 
    storePDF, 
    isGenerating, 
    isServerProcessing 
  } = usePDF();
  const { toast } = useToast();
  const [pdfUrl, setPdfUrl] = useState<string | null>(document?.supabase_pdf_url || null);
  const [showPreview, setShowPreview] = useState(false);
  const [showShare, setShowShare] = useState(false);
  
  // Get the appropriate icon based on the action
  const getIcon = () => {
    if (isGenerating || isServerProcessing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    switch (action) {
      case 'view': return <FileText className="h-4 w-4" />;
      case 'share': return <Share className="h-4 w-4" />;
      case 'download': return <Download className="h-4 w-4" />;
      case 'generate': return <FileText className="h-4 w-4" />;
      case 'server': return <Upload className="h-4 w-4" />;
      case 'regenerate': return <RefreshCw className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };
  
  // Get the appropriate label based on the action
  const getLabel = () => {
    if (!showLabel) return '';
    
    if (isGenerating) return 'Generating...';
    if (isServerProcessing) return 'Processing...';
    
    switch (action) {
      case 'view': return 'View PDF';
      case 'share': return 'Share PDF';
      case 'download': return 'Download PDF';
      case 'generate': return 'Generate PDF';
      case 'server': return 'Generate & Store';
      case 'regenerate': return 'Regenerate PDF';
      default: return 'PDF';
    }
  };
  
  // Get modal title
  const getModalTitle = (): string => {
    if (title) return title;
    
    const titles: Record<DocumentType, string> = {
      [DocumentType.INVOICE]: 'Invoice PDF',
      [DocumentType.ESTIMATE]: 'Estimate PDF',
      [DocumentType.PURCHASE_ORDER]: 'Purchase Order PDF'
    };
    
    return titles[documentType] || `${documentType.toString().charAt(0).toUpperCase() + documentType.toString().slice(1)} PDF`;
  };
  
  // Handle client-side PDF generation
  const handleClientGeneration = async (downloadFile: boolean = action === 'download', temporaryAction?: 'view' | 'share' | 'download' | 'generate' | 'regenerate') => {
    try {
      const options = {
        ...pdfOptions,
        download: downloadFile,
        forceRegenerate: action === 'regenerate' || forceRegenerate || pdfOptions?.forceRegenerate,
      };
      
      const result = await generatePDF(documentType, documentId, options);
      
      if (result.success && result.url) {
        setPdfUrl(result.url);
        
        if (onPDFGenerated) {
          onPDFGenerated(result.url);
        }
        
        // Show success toast
        toast({
          title: 'PDF Generated',
          description: 'The PDF has been successfully generated.',
        });
        
        // Handle the action based on the temporary action or the component action prop
        const effectiveAction = temporaryAction || action;
        if (!downloadFile) {
          if (effectiveAction === 'view' || effectiveAction === 'generate' || effectiveAction === 'regenerate') {
            setShowPreview(true);
          } else if (effectiveAction === 'share') {
            setShowShare(true);
          }
        }
        
        // Update document with new PDF URL if it exists
        if (document && 'supabase_pdf_url' in document) {
          document.supabase_pdf_url = result.url;
        }
      } else {
        throw new Error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Show error toast
      toast({
        title: 'PDF Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
      
      if (onError) {
        onError(error);
      }
    }
  };
  
  // Handle server-side PDF generation
  const handleServerGeneration = async () => {
    try {
      let result;
      
      if (useBatchProcessing) {
        // Use batch processing for multiple documents
        result = await batchGeneratePDF([{ documentType, documentId }]);
      } else {
        // Store a single PDF on the server
        result = await storePDF(documentType, documentId);
      }
      
      if (result.success) {
        // Set URL if available
        if (result.url) {
          setPdfUrl(result.url);
          
          if (onPDFGenerated) {
            onPDFGenerated(result.url);
          }
        }
        
        // Show success toast
        toast({
          title: 'PDF Generated on Server',
          description: useBatchProcessing 
            ? 'The PDF has been queued for generation on the server.'
            : 'The PDF has been successfully generated and stored on the server.',
        });
      } else {
        throw new Error(result.error || 'Failed to generate PDF on server');
      }
    } catch (error) {
      console.error('Error in server-side PDF generation:', error);
      
      // Show error toast
      toast({
        title: 'Server PDF Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
      
      if (onError) {
        onError(error);
      }
    }
  };
  
  // Handle button click based on the action
  const handleClick = async () => {
    // Check if we already have a PDF URL
    if (pdfUrl && action !== 'regenerate' && !forceRegenerate) {
      // If we already have a URL, just handle the action
      switch (action) {
        case 'view':
          setShowPreview(true);
          break;
        case 'share':
          setShowShare(true);
          break;
        case 'download':
          window.open(pdfUrl, '_blank');
          break;
        default:
          // For other actions, generate a new PDF
          if (action === 'server') {
            handleServerGeneration();
          } else {
            handleClientGeneration();
          }
          break;
      }
    } else {
      // No URL or regenerate requested, generate a new PDF
      if (action === 'server') {
        handleServerGeneration();
      } else {
        handleClientGeneration();
      }
    }
  };
  
  // Toggle share modal from preview
  const handleShare = () => {
    setShowPreview(false);
    setShowShare(true);
  };
  
  // Render dropdown for multiple options
  if (useDropdown) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={variant}
              size={size}
              disabled={disabled || isGenerating || isServerProcessing}
              className={className}
              {...props}
            >
              {getIcon()}
              {showLabel && <span className="ml-2">{getLabel()}</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => {
              // Use a temporary action type for view operation
              handleClientGeneration(false, 'view');
            }}>
              <FileText className="h-4 w-4 mr-2" />
              View PDF
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => {
              // Use a temporary action type for download operation
              handleClientGeneration(true, 'download');
            }}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => {
              // Use a temporary action type for share operation
              handleClientGeneration(false, 'share');
            }}>
              <Share className="h-4 w-4 mr-2" />
              Share PDF
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => {
              // Use a temporary action type for regenerate operation
              handleClientGeneration(false, 'regenerate');
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate PDF
            </DropdownMenuItem>
            
            {allowServerGeneration && (
              <DropdownMenuItem onClick={handleServerGeneration}>
                <Upload className="h-4 w-4 mr-2" />
                Generate & Store on Server
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* PDF Preview Modal */}
        {showPreview && pdfUrl && (
          <PDFPreviewModal
            pdfUrl={pdfUrl}
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            documentType={toLegacyDocumentTypeString(documentType)}
            document={document}
            title={getModalTitle()}
            onShare={showShareOption ? handleShare : undefined}
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
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={disabled || isGenerating || isServerProcessing}
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
          title={getModalTitle()}
          onShare={showShareOption ? handleShare : undefined}
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
          title={getModalTitle()}
        />
      )}
    </>
  );
}
