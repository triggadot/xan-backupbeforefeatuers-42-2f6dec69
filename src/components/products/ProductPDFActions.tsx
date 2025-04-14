import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Share2 } from 'lucide-react';
import { StandardPDFButton } from '@/components/pdf/StandardPDFButton';
import { DocumentType } from '@/types/pdf.unified';
import { usePDFOperations } from '@/hooks/pdf/usePDFOperations';
import { PDFPreviewModal } from '@/components/pdf/PDFPreviewModal';
import { PDFShareModal } from '@/components/pdf/PDFShareModal';
import { useToast } from '@/hooks/utils/use-toast';

interface ProductPDFActionsProps {
  /**
   * The ID of the product
   */
  productId: string;
  
  /**
   * The name of the product for PDF filename
   */
  productName?: string;
  
  /**
   * The URL of an existing PDF, if available
   */
  existingPdfUrl?: string | null;
  
  /**
   * Whether to show all actions or just the generate button
   */
  showAllActions?: boolean;
  
  /**
   * Custom class name for styling
   */
  className?: string;
}

/**
 * Component for PDF actions related to products
 * Provides buttons for generating, viewing, downloading, and sharing product PDFs
 * 
 * @example
 * // Basic usage with just the generate button
 * <ProductPDFActions productId="123" />
 * 
 * @example
 * // Full usage with all actions and existing PDF
 * <ProductPDFActions 
 *   productId="123" 
 *   existingPdfUrl="https://example.com/product.pdf"
 *   showAllActions={true}
 * />
 */
export function ProductPDFActions({
  productId,
  productName = 'Product',
  existingPdfUrl = null,
  showAllActions = true,
  className = ''
}: ProductPDFActionsProps) {
  const { toast } = useToast();
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(existingPdfUrl);
  const [showPreviewModal, setShowPreviewModal] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  
  // Use our custom PDF operations hook
  const { downloadPDF, checkExistingPDF } = usePDFOperations();
  
  // Check for existing PDF URL if none was provided
  React.useEffect(() => {
    const fetchPdfUrl = async () => {
      if (!existingPdfUrl) {
        try {
          const { data } = await checkExistingPDF('product', productId);
          if (data?.supabase_pdf_url) {
            setPdfUrl(data.supabase_pdf_url);
          }
        } catch (error) {
          console.error('Error checking for existing PDF:', error);
        }
      }
    };
    
    fetchPdfUrl();
  }, [productId, existingPdfUrl, checkExistingPDF]);
  
  /**
   * Handle PDF generation success
   */
  const handlePDFSuccess = (url: string) => {
    setPdfUrl(url);
  };
  
  /**
   * Handle PDF download
   */
  const handleDownload = async () => {
    if (!pdfUrl) {
      toast({
        title: 'Download Failed',
        description: 'No PDF URL available. Please generate the PDF first.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await downloadPDF(pdfUrl, `${productName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download the PDF.',
        variant: 'destructive',
      });
    }
  };
  
  /**
   * Handle opening the preview modal
   */
  const handleOpenPreview = () => {
    if (!pdfUrl) {
      toast({
        title: 'Preview Failed',
        description: 'No PDF URL available. Please generate the PDF first.',
        variant: 'destructive',
      });
      return;
    }
    
    setShowPreviewModal(true);
  };
  
  /**
   * Handle opening the share modal
   */
  const handleOpenShare = () => {
    if (!pdfUrl) {
      toast({
        title: 'Share Failed',
        description: 'No PDF URL available. Please generate the PDF first.',
        variant: 'destructive',
      });
      return;
    }
    
    setShowShareModal(true);
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Generate PDF Button */}
      <StandardPDFButton
        documentType={DocumentType.INVOICE} // Using INVOICE type for product PDFs
        documentId={productId}
        action="view"
        onPDFGenerated={handlePDFSuccess}
        showLabel={true}
        size="sm"
      />
      
      {/* Additional actions if requested and we have a PDF URL */}
      {showAllActions && (
        <>
          {/* View PDF Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenPreview}
            disabled={!pdfUrl}
            title="View PDF"
          >
            <FileText className="h-4 w-4 mr-2" />
            View
          </Button>
          
          {/* Download PDF Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!pdfUrl}
            title="Download PDF"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          
          {/* Share PDF Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenShare}
            disabled={!pdfUrl}
            title="Share PDF"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </>
      )}
      
      {/* Preview Modal */}
      {showPreviewModal && pdfUrl && (
        <PDFPreviewModal
          pdfUrl={pdfUrl}
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Product PDF"
        />
      )}
      
      {/* Share Modal */}
      {showShareModal && pdfUrl && (
        <PDFShareModal
          pdfUrl={pdfUrl}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title="Share Product PDF"
        />
      )}
    </div>
  );
}

export default ProductPDFActions;
