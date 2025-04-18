
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Download } from 'lucide-react';
import { useState } from 'react';

interface PDFViewerProps {
  url: string | null;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

export function PDFViewer({
  url,
  title,
  isOpen,
  onClose,
  onDownload
}: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{title}</span>
            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="ml-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative min-h-0">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {url ? (
            <iframe
              src={url}
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              No PDF available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
