import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Mail, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/utils/use-toast';
import { DocumentType } from './PDFButton';

interface PDFShareModalProps {
  pdfUrl: string;
  documentType: DocumentType;
  document: any;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal component for sharing PDFs via link or email
 */
export function PDFShareModal({
  pdfUrl,
  documentType,
  document,
  isOpen,
  onClose,
}: PDFShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSubject, setEmailSubject] = useState(getDefaultEmailSubject());
  const [emailBody, setEmailBody] = useState(getDefaultEmailBody());
  const [isSending, setIsSending] = useState(false);

  // Get default email subject based on document type
  function getDefaultEmailSubject(): string {
    switch (documentType) {
      case 'invoice':
        return `Invoice ${document.invoice_uid || ''} from ${document.gl_accounts?.account_name || 'Us'}`;
      case 'purchaseOrder':
        return `Purchase Order ${document.purchase_order_uid || ''} for ${document.gl_accounts?.account_name || 'Vendor'}`;
      case 'estimate':
        return `Estimate ${document.estimate_uid || ''} for ${document.gl_accounts?.account_name || 'You'}`;
      default:
        return 'Document Shared';
    }
  }

  // Get default email body based on document type
  function getDefaultEmailBody(): string {
    const documentName = documentType.charAt(0).toUpperCase() + documentType.slice(1);
    return `Please find the attached ${documentName} at the following link:\n\n${pdfUrl}\n\nThank you for your business.`;
  }

  // Handle copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pdfUrl);
      setCopied(true);
      toast({
        title: 'Link Copied',
        description: 'The PDF link has been copied to your clipboard.',
      });
      
      // Reset copied state after 3 seconds
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy the link. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle send email
  const handleSendEmail = () => {
    if (!emailAddress) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    // Create mailto link with subject and body
    const mailtoLink = `mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Open default email client
    window.location.href = mailtoLink;
    
    // Show success toast
    toast({
      title: 'Email Prepared',
      description: 'Your email has been prepared in your default email client.',
    });
    
    setIsSending(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share PDF</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Copy Link</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="mt-4">
            <div className="flex items-center space-x-2">
              <Input
                value={pdfUrl}
                readOnly
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCopyLink}
                disabled={copied}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Copy this link to share the PDF document.
            </p>
          </TabsContent>
          
          <TabsContent value="email" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="recipient@example.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                rows={4}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <Tabs.Consumer>
            {(value) => (
              value === 'link' ? (
                <Button onClick={handleCopyLink} disabled={copied}>
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              ) : (
                <Button onClick={handleSendEmail} disabled={isSending}>
                  <Mail className="h-4 w-4 mr-2" />
                  {isSending ? 'Sending...' : 'Send Email'}
                </Button>
              )
            )}
          </Tabs.Consumer>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
