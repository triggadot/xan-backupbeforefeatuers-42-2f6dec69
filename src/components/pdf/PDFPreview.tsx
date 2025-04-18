
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Download, Share2, Loader2 } from 'lucide-react';

interface PDFPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  title: string;
  isGenerating?: boolean;
  onDownload?: () => void;
  onShare?: () => void;
}

export function PDFPreview({
  isOpen,
  onClose,
  pdfUrl,
  title,
  isGenerating = false,
  onDownload,
  onShare
}: PDFPreviewProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative min-h-0 border rounded-md">
          {isGenerating ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={`PDF Preview: ${title}`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">No PDF available</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            {onDownload && (
              <Button
                variant="outline"
                onClick={onDownload}
                disabled={!pdfUrl || isGenerating}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            {onShare && (
              <Button
                variant="outline"
                onClick={onShare}
                disabled={!pdfUrl || isGenerating}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
