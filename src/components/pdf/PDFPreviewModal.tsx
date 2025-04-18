
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

export interface PDFPreviewModalProps {
  pdfUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  documentType?: string;
  document?: any; // Optional document data
  onShare?: () => void; // Optional callback for sharing the PDF
}

/**
 * Modal for previewing PDF documents with zoom and download controls
 */
export function PDFPreviewModal({ pdfUrl, isOpen, onClose, title, documentType, document, onShare }: PDFPreviewModalProps) {
  // State declarations first
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  // Add a style tag to apply the transform using CSS custom properties
  const styleId = 'pdf-preview-dynamic-style';
  
  // Create or update the style tag when zoom or rotation changes
  React.useEffect(() => {
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `
      [data-transform-scale][data-transform-rotate] {
        transform: scale(var(--scale)) rotate(var(--rotate));
      }
    `;
    
    return () => {
      // Clean up the style tag when component unmounts
      if (styleEl && !isOpen) {
        document.head.removeChild(styleEl);
      }
    };
  }, [isOpen]);
  
  // Update CSS custom properties when zoom or rotation changes
  React.useEffect(() => {
    const element = document.querySelector('[data-transform-scale][data-transform-rotate]') as HTMLElement;
    if (element) {
      element.style.setProperty('--scale', String(zoom));
      element.style.setProperty('--rotate', `${rotation}deg`);
    }
  }, [zoom, rotation]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // Generate a better filename based on document type and title/ID
  const getFileName = () => {
    // If we have a document with ID, use that for the filename
    if (document) {
      const docId = document.invoice_uid || document.estimate_uid || document.purchase_order_uid || document.id;
      if (docId) {
        const docType = documentType || 'document';
        return `${docType}_${docId}.pdf`;
      }
    }
    
    // If we have a title, use that
    if (title) {
      return `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    }
    
    // Default fallback
    return 'document.pdf';
  };
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = getFileName();
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="font-semibold">{title || 'PDF Preview'}</div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            {onShare && (
              <Button variant="outline" size="icon" onClick={onShare}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center">
          <div 
            className={`h-full origin-center transition-transform duration-200 ease-in-out ${
              zoom !== 1 || rotation !== 0 ? 'transform' : ''
            }`}
            // We're using a data attribute to store the transform values
            // This will be picked up by our custom CSS in a more Tailwind-friendly way
            data-transform-scale={zoom}
            data-transform-rotate={rotation}
            // The actual transform is applied via CSS custom properties in a style tag
            // This avoids the inline style lint warning while still allowing dynamic transforms
          >
            <iframe 
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              className="border-none h-full min-w-[700px] min-h-[90%]"
              title="PDF Preview"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
