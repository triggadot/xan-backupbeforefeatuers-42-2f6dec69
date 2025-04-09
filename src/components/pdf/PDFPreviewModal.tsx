
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

export interface PDFPreviewModalProps {
  pdfUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

/**
 * Modal for previewing PDF documents with zoom and download controls
 */
export function PDFPreviewModal({ pdfUrl, isOpen, onClose, title }: PDFPreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    const downloadName = title ? 
      `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf` : 
      'document.pdf';
    link.download = downloadName;
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
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center">
          <div 
            style={{ 
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease'
            }}
            className="h-full"
          >
            <iframe 
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              className="border-none h-full"
              style={{
                minWidth: '700px',
                minHeight: '90%'
              }}
              title="PDF Preview"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
