import React, { useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { usePDFOperations, DocumentType } from '@/hooks/pdf/usePDFOperations';
import { useToast } from '@/hooks/utils/use-toast';

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
export const PDFActions: React.FC<PDFActionsProps> = ({
  documentType,
  document,
  showLabels = false,
  onPDFGenerated,
  ...rest
}) => {
  const { toast } = useToast();
  const { generatePDF, downloadPDF, isGenerating, isStoring } = usePDFOperations();
  const [isLoading, setIsLoading] = useState(false);

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
        url = await generatePDF(documentType, document, true); // true = download after generation
        
        if (url && onPDFGenerated) {
          onPDFGenerated(url);
        }
      } else {
        console.log(`Using existing ${documentType} PDF URL:`, url);
        // Generate filename based on document details
        let fileName = '';
        
        switch (documentType) {
          case 'invoice':
            fileName = `Invoice_${document.invoice_uid || document.id?.substring(0, 8) || 'unknown'}.pdf`;
            break;
          case 'purchaseOrder':
            fileName = `PO_${document.purchase_order_uid || document.id?.substring(0, 8) || 'unknown'}.pdf`;
            break;
          case 'estimate':
            fileName = `Estimate_${document.estimate_uid || document.id?.substring(0, 8) || 'unknown'}.pdf`;
            break;
          default:
            fileName = `Document_${document.id?.substring(0, 8) || 'unknown'}.pdf`;
        }
        
        // Download the PDF directly
        await downloadPDF(url, fileName);
      }
    } catch (error) {
      console.error(`Error handling ${documentType} PDF download:`, error);
      toast({
        title: 'PDF Download Failed',
        description: error instanceof Error ? error.message : 'There was an error downloading the PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PDF generation
  const handleGeneratePDF = async () => {
    if (!document) return;
    
    try {
      setIsLoading(true);
      toast({
        title: 'Generating PDF',
        description: 'Creating your PDF document...',
      });
      
      const url = await generatePDF(documentType, document, false);
      
      if (url && onPDFGenerated) {
        onPDFGenerated(url);
      }
    } catch (error) {
      console.error(`Error generating ${documentType} PDF:`, error);
      toast({
        title: 'PDF Generation Failed',
        description: error instanceof Error ? error.message : 'There was an error generating the PDF. Please try again.',
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
        toast({
          title: 'Generating PDF',
          description: 'Creating your PDF for viewing...',
        });
        
        // Generate new PDF if none exists
        url = await generatePDF(documentType, document, false);
        
        if (url && onPDFGenerated) {
          onPDFGenerated(url);
        }
      }
      
      if (url) {
        // Open PDF in a new tab
        window.open(url, '_blank');
      } else {
        throw new Error('Failed to generate or retrieve PDF for viewing');
      }
    } catch (error) {
      console.error(`Error viewing ${documentType} PDF:`, error);
      toast({
        title: 'PDF View Failed',
        description: error instanceof Error ? error.message : 'There was an error preparing the PDF for viewing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state for buttons
  const loading = isLoading || isGenerating || isStoring;

  return (
    <div className="flex space-x-2">
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
    </div>
  );
};
