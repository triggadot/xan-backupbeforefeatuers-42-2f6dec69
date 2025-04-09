
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyIcon, Mail, Share2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/utils/use-toast';
import { PDFPreviewModalProps } from './PDFPreviewModal';

export interface PDFShareModalProps extends PDFPreviewModalProps {
  title?: string;
}

/**
 * Modal for sharing PDF documents via various methods (email, link, etc.)
 */
export function PDFShareModal({ pdfUrl, isOpen, onClose, title = 'Share Document' }: PDFShareModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('email');
  const [copied, setCopied] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState(`${title || 'Document'} Shared with You`);
  const [emailBody, setEmailBody] = useState('');
  
  // Safe function to get document type from title or URL
  const getDocumentType = (): string => {
    if (title) {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('invoice')) return 'invoice';
      if (lowerTitle.includes('purchase order')) return 'purchase order';
      if (lowerTitle.includes('estimate')) return 'estimate';
      return 'document';
    }
    
    if (pdfUrl) {
      const lowerUrl = pdfUrl.toLowerCase();
      if (lowerUrl.includes('invoice')) return 'invoice';
      if (lowerUrl.includes('po') || lowerUrl.includes('purchase')) return 'purchase order';
      if (lowerUrl.includes('estimate')) return 'estimate';
    }
    
    return 'document';
  };

  // Generate default email body based on document type
  const getDefaultEmailBody = useMemo(() => {
    const docType = getDocumentType();
    return `I'm sharing this ${docType} with you for your reference. You can view or download it using the link below:\n\n${pdfUrl || ''}`;
  }, [pdfUrl, title]);
  
  // Set default email body when component mounts or when URL changes
  React.useEffect(() => {
    setEmailBody(getDefaultEmailBody);
  }, [getDefaultEmailBody]);

  const handleCopyLink = async () => {
    if (!pdfUrl) {
      toast({
        title: "Error",
        description: "No PDF URL available to copy",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await navigator.clipboard.writeText(pdfUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "PDF link copied to clipboard",
      });
      
      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = () => {
    if (!recipient) {
      toast({
        title: "Missing Recipient",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }
    
    if (!pdfUrl) {
      toast({
        title: "Error",
        description: "No PDF URL available to share",
        variant: "destructive",
      });
      return;
    }
    
    // Create mailto link with subject and body
    const mailtoLink = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink, '_blank');
    
    toast({
      title: "Email Prepared",
      description: "Your email client has been opened with the prepared message",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title || 'Share Document'}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="email" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" /> Email
            </TabsTrigger>
            <TabsTrigger value="link">
              <Share2 className="h-4 w-4 mr-2" /> Copy Link
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="recipient" className="text-sm font-medium">Recipient Email</label>
              <Input 
                id="recipient" 
                placeholder="example@email.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">Subject</label>
              <Input 
                id="subject" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <Textarea 
                id="message" 
                rows={5} 
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)} 
              />
            </div>
            <Button className="w-full" onClick={handleSendEmail}>
              <Mail className="h-4 w-4 mr-2" /> Send Email
            </Button>
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4">
            <div className="flex space-x-2">
              <Input 
                value={pdfUrl || ''} 
                readOnly 
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
                <span className="sr-only">Copy</span>
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              This link provides direct access to the PDF document.
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
