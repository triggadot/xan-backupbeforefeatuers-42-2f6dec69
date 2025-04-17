import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, Loader2 } from 'lucide-react';
import { usePDF } from '@/hooks/pdf/usePDF';
import { DocumentType } from '@/types/pdf.unified';

interface PDFCreatorProps {
  documentType: DocumentType;
  document: any;
  title?: string;
  description?: string;
  className?: string;
  onPDFGenerated?: (pdfUrl: string) => void;
}

/**
 * A component for creating and downloading PDFs
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export function PDFCreator({
  documentType,
  document,
  title,
  description,
  className = '',
  onPDFGenerated,
}: PDFCreatorProps) {
  const { generatePDF, isGenerating } = usePDF();
  const [saveLocally, setSaveLocally] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(document?.supabase_pdf_url || null);

  // Get document title based on document type
  const getDocumentTitle = () => {
    switch (documentType) {
      case DocumentType.INVOICE:
        return `Invoice ${document.invoice_uid || ''}`;
      case DocumentType.PURCHASE_ORDER:
        return `Purchase Order ${document.purchase_order_uid || ''}`;
      case DocumentType.ESTIMATE:
        return `Estimate ${document.estimate_uid || ''}`;
      default:
        return 'Document';
    }
  };

  // Handle PDF generation
  const handleGeneratePDF = async () => {
    try {
      const url = await generatePDF(documentType as any, document, saveLocally);
      if (url) {
        setPdfUrl(url);
        if (onPDFGenerated) onPDFGenerated(url);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>{title || 'Create PDF'}</CardTitle>
        <CardDescription>
          {description || `Generate a PDF for ${getDocumentTitle()}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="save-locally"
            checked={saveLocally}
            onCheckedChange={(checked) => setSaveLocally(!!checked)}
          />
          <label
            htmlFor="save-locally"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Save PDF locally after generation
          </label>
        </div>

        {pdfUrl && (
          <div className="p-4 bg-muted rounded-md mb-4">
            <p className="text-sm mb-2">PDF successfully generated!</p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline truncate block"
            >
              {pdfUrl}
            </a>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          disabled={isGenerating}
          onClick={handleGeneratePDF}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate PDF
            </>
          )}
        </Button>
        
        {pdfUrl && (
          <Button
            variant="default"
            onClick={handleDownloadPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
