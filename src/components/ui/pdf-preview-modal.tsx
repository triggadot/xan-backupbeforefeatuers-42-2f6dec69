import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Share2, X } from 'lucide-react';
import { useToast } from '@/hooks/utils/use-toast';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  title: string;
  onDownload?: () => void;
  onShare?: () => void;
  isGenerating?: boolean;
}

export function PDFPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  title,
  onDownload,
  onShare,
  isGenerating = false,
}: PDFPreviewModalProps) {
  const { toast } = useToast();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    // Reset iframe loaded state when URL changes
    if (pdfUrl) {
      setIframeLoaded(false);
    }
  }, [pdfUrl]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (pdfUrl) {
      // Default download behavior
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: 'PDF Downloaded',
        description: 'Your PDF has been downloaded successfully.',
      });
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else if (pdfUrl) {
      // Default share behavior - copy link to clipboard
      navigator.clipboard.writeText(pdfUrl)
        .then(() => {
          toast({
            title: 'Link Copied',
            description: 'PDF link has been copied to clipboard.',
          });
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
          toast({
            title: 'Failed to Copy Link',
            description: 'Please try again or share the link manually.',
            variant: 'destructive',
          });
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>
            {isGenerating ? 'Generating PDF, please wait...' : 'Preview your document below'}
          </DialogDescription>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 relative min-h-0 border rounded-md overflow-hidden">
          {isGenerating ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating PDF...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <iframe 
                src={pdfUrl} 
                className="w-full h-full border-0" 
                onLoad={handleIframeLoad}
                title={`PDF Preview: ${title}`}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">No PDF available to preview</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {pdfUrl ? 'PDF ready for download or sharing' : 'Generate a PDF to enable download and sharing'}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!pdfUrl || isGenerating}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              disabled={!pdfUrl || isGenerating}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
