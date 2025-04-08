import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, Mail } from 'lucide-react';
import { useToast } from '@/hooks/utils/use-toast';

interface PDFShareLinkProps {
  pdfUrl: string | null;
  documentTitle: string;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export function PDFShareLink({
  pdfUrl,
  documentTitle,
  disabled = false,
  className = '',
  variant = 'outline',
}: PDFShareLinkProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleCopyLink = () => {
    if (!pdfUrl) return;
    
    navigator.clipboard.writeText(pdfUrl)
      .then(() => {
        setCopied(true);
        toast({
          title: 'Link Copied',
          description: 'PDF link has been copied to clipboard.',
        });
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        toast({
          title: 'Failed to Copy Link',
          description: 'Please try again or share the link manually.',
          variant: 'destructive',
        });
      });
  };

  const handleEmailShare = () => {
    if (!pdfUrl) return;
    
    const subject = encodeURIComponent(`PDF Document: ${documentTitle}`);
    const body = encodeURIComponent(`Here's the link to the ${documentTitle} PDF: ${pdfUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    
    // Close popover after email client opens
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={variant} 
          size="sm" 
          className={`flex items-center gap-2 ${className}`}
          disabled={disabled || !pdfUrl}
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Share PDF Document</h4>
          <p className="text-sm text-muted-foreground">
            Share this PDF document via link or email
          </p>
          
          <div className="flex items-center space-x-2">
            <Input 
              value={pdfUrl || ''} 
              readOnly 
              className="flex-1 text-xs"
            />
            <Button 
              size="icon" 
              variant="outline" 
              onClick={handleCopyLink}
              disabled={!pdfUrl}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleEmailShare}
              disabled={!pdfUrl}
            >
              <Mail className="h-4 w-4" />
              Email Link
            </Button>
            
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
