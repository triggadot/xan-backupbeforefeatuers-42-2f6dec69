import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * @deprecated This is a temporary placeholder component.
 * The original component had TypeScript errors and will be rebuilt in a future update.
 */
interface PDFPreviewProps {
  url: string | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * PDFPreview component displays a PDF in a modal/drawer
 * Shows as a popup on desktop and slides from bottom on mobile
 */
export const PDFPreview: React.FC<PDFPreviewProps> = ({
  url,
  isOpen,
  onClose
}) => {
  const [isMounted, setIsMounted] = useState(false);
  
  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    setIsMounted(true);
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);
  
  // Don't render anything on server
  if (!isMounted) return null;
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* PDF Container - Modal on desktop, drawer on mobile */}
      <div 
        className={cn(
          "fixed z-50 bg-white rounded-t-lg shadow-lg transition-all duration-300 ease-in-out",
          "md:rounded-lg md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-5xl md:h-[85vh]",
          "bottom-0 left-0 w-full h-[90vh]",
          isOpen ? "translate-y-0" : "translate-y-full md:opacity-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">PDF Preview</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* PDF Viewer */}
        <div className="w-full h-[calc(100%-4rem)] overflow-hidden">
          {url ? (
            <iframe 
              src={`${url}#toolbar=0`}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No PDF available to preview</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PDFPreview;
