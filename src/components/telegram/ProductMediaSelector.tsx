/**
 * Component for selecting Telegram media to use in product creation or update.
 * This component bridges the Telegram media system with the product management system.
 */
import React, { useState } from 'react';
import { useMediaMessages } from '@/hooks/telegram';
import { MediaMessage } from '@/types/telegram/messages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MediaMessageList } from './MediaMessageList';
import { MediaMessageDetail } from './MediaMessageDetail';

interface ProductMediaSelectorProps {
  onSelectMedia: (mediaMessage: MediaMessage) => void;
  buttonLabel?: string;
  title?: string;
}

/**
 * A component that provides a UI for selecting Telegram media to use in product creation or update.
 * Opens a drawer/sheet with media selection options.
 */
export function ProductMediaSelector({
  onSelectMedia,
  buttonLabel = 'Select Media from Telegram',
  title = 'Select Product Media',
}: ProductMediaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MediaMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaType, setMediaType] = useState<string>('photo');
  
  // Reset state when closed
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedMessage(null);
      setSearchTerm('');
    }
  };
  
  const handleSelectMessage = (message: MediaMessage) => {
    setSelectedMessage(message);
  };
  
  const handleConfirmSelection = () => {
    if (selectedMessage) {
      onSelectMedia(selectedMessage);
      setIsOpen(false);
    }
  };
  
  const handleBack = () => {
    setSelectedMessage(null);
  };
  
  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        {buttonLabel}
      </Button>
      
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="sm:max-w-[800px] w-full overflow-y-auto" side="right">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              Select media from your Telegram chats to use for this product.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-4">
            {!selectedMessage ? (
              <>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <Input
                    placeholder="Search caption text..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow"
                  />
                  
                  <Select
                    value={mediaType}
                    onValueChange={(value) => setMediaType(value)}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Media Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photo">Photos</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                      <SelectItem value="">All Media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <MediaMessageList
                  mediaType={mediaType || undefined}
                  withCaption={true}
                  onSelectMessage={handleSelectMessage}
                  title="Available Media"
                />
              </>
            ) : (
              <>
                <MediaMessageDetail
                  messageId={selectedMessage.id}
                  onBack={handleBack}
                />
                
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant="default"
                    onClick={handleConfirmSelection}
                    disabled={!selectedMessage.public_url}
                  >
                    Use this media for product
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
