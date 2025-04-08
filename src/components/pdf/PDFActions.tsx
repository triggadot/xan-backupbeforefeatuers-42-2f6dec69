import React, { useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { usePDFOperations, DocumentType } from '@/hooks/pdf/usePDFOperations';
import { useToast } from '@/hooks/utils/use-toast';
import { PDFPreview } from './PDFPreview';

interface PDFActionsProps extends Omit<ButtonProps, 'onClick'> {
  documentType: DocumentType;
  document: any;
  showLabels?: boolean;
  onPDFGenerated?: (url: string) => void;
}

/**
 * PDFActions component provides buttons for PDF operations
 * 
 * @param documentType - Type of document (invoice, purchaseOrder, estimate)
 * @param document - The document data
 * @param showLabels - Whether to show text labels on buttons
 * @param onPDFGenerated - Callback when PDF is generated
 * @param rest - Other button props
 */
export const PDFActions: React.FC<PDFActionsProps & ButtonProps> = ({
  documentType,
  document,
  showLabels = false,
  onPDFGenerated,
  children,
  ...rest
}) => {
  const { toast } = useToast();
  const { generatePDF, downloadPDF, loading: pdfLoading } = usePDFOperations();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Loading state combines all possible loading states
  const loading = isLoading || pdfLoading;

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!document) return;
    
    try {
      setIsLoading(true);
      toast({
        title: 'PDF Download',
        description: 'Preparing your PDF...',
      });
      
      // Use existing PDF URL or generate a new one
      let url = document.supabase_pdf_url;
      
      if (!url) {
        // Generate new PDF if none exists
        console.log(`No existing PDF found, generating new ${documentType} PDF`);
        const result = await generatePDF(documentType, document.id || document.glide_row_id, true);
        
        if (result.success && result.url) {
          url = result.url;
          if (onPDFGenerated) {
            onPDFGenerated(url);
          }
        } else {
          throw new Error(result.error || 'Failed to generate PDF');
        }
      } else {
        console.log(`Using existing ${documentType} PDF URL:`, url);
        // Download the existing PDF
        await downloadPDF(url, getFileName());
      }
      
      toast({
        title: 'PDF Downloaded',
        description: 'Your PDF has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to download PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get filename for download
  const getFileName = () => {
    let fileName = '';
    
    switch (documentType) {
      case 'invoice':
        fileName = `Invoice_${document.invoice_uid || document.id || 'document'}.pdf`;
        break;
      case 'purchaseOrder':
        fileName = `PurchaseOrder_${document.purchase_order_uid || document.id || 'document'}.pdf`;
        break;
      case 'estimate':
        fileName = `Estimate_${document.estimate_uid || document.id || 'document'}.pdf`;
        break;
      case 'product':
        fileName = `Product_${document.product_name || document.id || 'document'}.pdf`;
        break;
      default:
        fileName = `Document_${document.id || 'document'}.pdf`;
    }
    
    return fileName;
  };
  
  // Handle PDF generation
  const handleGeneratePDF = async () => {
    if (!document) return;
    
    try {
      setIsLoading(true);
      toast({
        title: 'Generating PDF',
        description: 'Creating your PDF...',
      });
      
      const result = await generatePDF(documentType, document.id || document.glide_row_id);
      
      if (result.success && result.url) {
        if (onPDFGenerated) {
          onPDFGenerated(result.url);
        }
        
        toast({
          title: 'PDF Generated',
          description: 'Your PDF has been successfully created.',
        });
      } else {
        throw new Error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle PDF view
  const handleViewPDF = async () => {
    if (!document) return;
    
    try {
      setIsLoading(true);
      
      // Use existing PDF URL or generate a new one
      let url = document.supabase_pdf_url;
      
      if (!url) {
        // Generate new PDF if none exists
        console.log(`No existing PDF found, generating new ${documentType} PDF for preview`);
        const result = await generatePDF(documentType, document.id || document.glide_row_id);
        
        if (result.success && result.url) {
          url = result.url;
          if (onPDFGenerated) {
            onPDFGenerated(url);
          }
        } else {
          throw new Error(result.error || 'Failed to generate PDF');
        }
      }
      
      // Open the preview
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF preview. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {children ? (
        <Button
          variant={rest.variant || 'outline'}
          size={rest.size || 'default'}
          onClick={handleGeneratePDF}
          disabled={loading}
          className={rest.className}
        >
          <FileText className="h-4 w-4 mr-2" />
          {children}
        </Button>
      ) : (
        <>
          <Button
            variant={rest.variant || 'outline'}
            size={rest.size || 'default'}
            onClick={handleGeneratePDF}
            disabled={loading}
            className={rest.className}
          >
            <FileText className="h-4 w-4 mr-2" />
            {showLabels && 'Generate'}
          </Button>
          
          <Button
            variant={rest.variant || 'outline'}
            size={rest.size || 'default'}
            onClick={handleDownloadPDF}
            disabled={loading}
            className={rest.className}
          >
            <Download className="h-4 w-4 mr-2" />
            {showLabels && 'Download'}
          </Button>
          
          <Button
            variant={rest.variant || 'outline'}
            size={rest.size || 'default'}
            onClick={handleViewPDF}
            disabled={loading}
            className={rest.className}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showLabels && 'View'}
          </Button>
        </>
      )}
      
      {/* PDF Preview Modal/Drawer */}
      <PDFPreview
        url={previewUrl}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
};
