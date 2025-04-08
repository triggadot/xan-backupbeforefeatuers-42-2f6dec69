import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DocumentType } from './PDFButton';
import { PDFShareModal } from './PDFShareModal';

interface PDFPreviewModalProps {
  pdfUrl: string;
  documentType: DocumentType;
  document: any;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal component for previewing PDFs with options to download and share
 */
export function PDFPreviewModal({
  pdfUrl,
  documentType,
  document,
  isOpen,
  onClose,
}: PDFPreviewModalProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [scale, setScale] = useState(1);

  // Get document title based on document type
  const getDocumentTitle = () => {
    switch (documentType) {
      case 'invoice':
        return `Invoice ${document.invoice_uid || ''}`;
      case 'purchaseOrder':
        return `Purchase Order ${document.purchase_order_uid || ''}`;
      case 'estimate':
        return `Estimate ${document.estimate_uid || ''}`;
      default:
        return 'Document Preview';
    }
  };

  // Handle zoom in
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 2));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  // Handle download
  const handleDownload = () => {
    window.open(pdfUrl, '_blank');
  };

  // Handle share
  const handleShare = () => {
    setShowShareModal(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{getDocumentTitle()}</DialogTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">{Math.round(scale * 100)}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
            <div 
              style={{ 
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-in-out'
              }}
              className="bg-white shadow-lg"
            >
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                className="w-full h-[70vh]"
                title={getDocumentTitle()}
              />
            </div>
          </div>
          
          <DialogFooter className="p-4 border-t">
            <div className="flex justify-between w-full">
              <div className="text-sm text-gray-500">
                {documentType === 'invoice' && document.gl_accounts?.account_name && (
                  <span>Customer: {document.gl_accounts.account_name}</span>
                )}
                {documentType === 'purchaseOrder' && document.gl_accounts?.account_name && (
                  <span>Vendor: {document.gl_accounts.account_name}</span>
                )}
                {documentType === 'estimate' && document.gl_accounts?.account_name && (
                  <span>Customer: {document.gl_accounts.account_name}</span>
                )}
              </div>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Share Modal */}
      {showShareModal && (
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
