
import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { FileText, Share, Download, Loader2 } from 'lucide-react';
import { DocumentType } from '@/types/pdf-types';
import { usePDF } from '@/hooks/usePDF';
import { PDFViewer } from '@/components/ui/pdf-viewer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StandardPDFButtonProps extends ButtonProps {
  documentType: DocumentType;
  documentId: string;
  document?: any;
  showLabel?: boolean;
  onPDFGenerated?: (url: string) => void;
  useDropdown?: boolean;
  title?: string;
}

export function StandardPDFButton({
  documentType,
  documentId,
  document,
  showLabel = true,
  onPDFGenerated,
  useDropdown = false,
  title,
  children,
  ...props
}: StandardPDFButtonProps) {
  const { generatePDF, downloadPDF, isGenerating } = usePDF();
  const [pdfUrl, setPdfUrl] = useState<string | null>(document?.supabase_pdf_url || null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  const getModalTitle = () => {
    if (title) return title;
    
    switch (documentType) {
      case DocumentType.INVOICE: return 'Invoice PDF';
      case DocumentType.ESTIMATE: return 'Estimate PDF';
      case DocumentType.PURCHASE_ORDER: return 'Purchase Order PDF';
      default: return 'Document PDF';
    }
  };

  const handleGeneratePDF = async (download = false) => {
    try {
      const result = await generatePDF(documentType, documentId, { download });

      if (result.success && result.url) {
        setPdfUrl(result.url);
        
        if (onPDFGenerated) {
          onPDFGenerated(result.url);
        }

        if (!download) {
          setShowPdfViewer(true);
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleViewPDF = async () => {
    if (pdfUrl) {
      setShowPdfViewer(true);
    } else {
      await handleGeneratePDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (pdfUrl) {
      const fileName = document?.invoice_uid || document?.purchase_order_uid || document?.estimate_uid || `document-${documentId}`;
      downloadPDF(pdfUrl, `${fileName}.pdf`);
    } else {
      await handleGeneratePDF(true);
    }
  };

  if (useDropdown) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button {...props} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              {showLabel && 'PDF Options'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleViewPDF}>
              <FileText className="h-4 w-4 mr-2" />
              View PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGeneratePDF(false)}>
              <Share className="h-4 w-4 mr-2" />
              Regenerate PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <PDFViewer 
          url={pdfUrl}
          title={getModalTitle()}
          isOpen={showPdfViewer}
          onClose={() => setShowPdfViewer(false)}
          onDownload={handleDownloadPDF}
        />
      </>
    );
  }

  return (
    <>
      <Button 
        onClick={handleViewPDF}
        disabled={isGenerating}
        {...props}
      >
        {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
        {showLabel && 'View PDF'}
      </Button>

      <PDFViewer 
        url={pdfUrl}
        title={getModalTitle()}
        isOpen={showPdfViewer}
        onClose={() => setShowPdfViewer(false)}
        onDownload={handleDownloadPDF}
      />
    </>
  );
}
