/**
 * Component for displaying detailed information about a Telegram media message,
 * including the ability to integrate with product data.
 */
import React from 'react';
import { format } from 'date-fns';
import { useMediaMessages, useMessageProcessing } from '@/hooks/telegram';
import { MediaMessage } from '@/types/telegram/messages';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MediaMessageDetailProps {
  messageId: string;
  onCreateProduct?: (message: MediaMessage) => void;
  onBack?: () => void;
}

/**
 * Displays detailed information about a Telegram media message and allows 
 * integration with the product system.
 */
export function MediaMessageDetail({
  messageId,
  onCreateProduct,
  onBack,
}: MediaMessageDetailProps) {
  const { useMediaMessageDetail } = useMediaMessages();
  const { processMediaMessage, resetMediaMessageProcessing } = useMessageProcessing();
  
  const {
    data: message,
    isLoading,
    error,
    refetch,
  } = useMediaMessageDetail(messageId);
  
  // Get any messages in the same media group
  const { data: groupMessages = [] } = useMediaMessages().useMediaGroupMessages(
    message?.media_group_id,
    !!message?.media_group_id
  );
  
  const handleProcessMessage = async () => {
    if (!message) return;
    await processMediaMessage.mutateAsync(message);
    refetch();
  };
  
  const handleResetProcessing = async () => {
    if (!message) return;
    await resetMediaMessageProcessing.mutateAsync(message.id);
    refetch();
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error || !message) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load message details.
          <Button variant="outline" className="ml-4" onClick={() => refetch()}>
            Retry
          </Button>
          {onBack && (
            <Button variant="ghost" className="ml-2" onClick={onBack}>
              Back
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Extract metadata from analyzed content
  const analyzedContent = message.analyzed_content || message.caption_data || {};
  const productName = analyzedContent.product_name || 'Unnamed Product';
  const productCode = analyzedContent.product_code || 'Unknown Code';
  const vendorUid = analyzedContent.vendor_uid;
  const purchaseDate = analyzedContent.purchase_date 
    ? format(new Date(analyzedContent.purchase_date), 'PP')
    : undefined;
  const quantity = analyzedContent.product_quantity;
  
  // Determine if we can create a product from this message
  const canCreateProduct = !!message.public_url && 
                         !!analyzedContent.product_name;
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="truncate">{productName}</CardTitle>
        <div className="flex space-x-2">
          {message.processing_state && (
            <Badge variant={message.processing_state === 'error' ? 'destructive' : 'secondary'}>
              {message.processing_state}
            </Badge>
          )}
          {message.media_type && (
            <Badge variant="outline" className="capitalize">
              {message.media_type}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            {message.media_group_id && groupMessages.length > 1 && (
              <TabsTrigger value="group">Group Images ({groupMessages.length})</TabsTrigger>
            )}
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="flex justify-center">
              {message.public_url ? (
                <img
                  src={message.public_url}
                  alt={productName}
                  className="max-h-[500px] max-w-full object-contain rounded-md border"
                />
              ) : (
                <div className="h-[300px] w-full flex items-center justify-center bg-muted rounded-md">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
            </div>
            
            {message.caption && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Caption:</h3>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {message.caption}
                </div>
              </div>
            )}
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Product Information:</h3>
                <div className="space-y-1">
                  <div className="flex">
                    <span className="text-sm font-medium w-32">Product Name:</span>
                    <span className="text-sm">{analyzedContent.product_name || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-medium w-32">Product Code:</span>
                    <span className="text-sm">{analyzedContent.product_code || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-medium w-32">SKU:</span>
                    <span className="text-sm">{analyzedContent.product_sku || 'Not specified'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Purchase Information:</h3>
                <div className="space-y-1">
                  <div className="flex">
                    <span className="text-sm font-medium w-32">Vendor:</span>
                    <span className="text-sm">{analyzedContent.vendor_uid || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-medium w-32">Purchase Date:</span>
                    <span className="text-sm">{purchaseDate || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-medium w-32">Quantity:</span>
                    <span className="text-sm">{quantity !== undefined ? quantity : 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              {onCreateProduct && (
                <Button 
                  onClick={() => onCreateProduct(message)}
                  disabled={!canCreateProduct}
                  className="flex-grow md:flex-grow-0"
                >
                  Create Product
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleProcessMessage}
                disabled={processMediaMessage.isPending || message.processing_state === 'processing'}
                className="flex-grow md:flex-grow-0"
              >
                {processMediaMessage.isPending ? 'Processing...' : 'Process Message'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleResetProcessing}
                disabled={resetMediaMessageProcessing.isPending}
                className="flex-grow md:flex-grow-0"
              >
                Reset Processing
              </Button>
              
              {onBack && (
                <Button
                  variant="ghost"
                  onClick={onBack}
                  className="flex-grow md:flex-grow-0 ml-auto"
                >
                  Back to List
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="metadata">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">File Information:</h3>
                  <div className="rounded-md border divide-y">
                    <div className="flex px-3 py-2">
                      <span className="text-sm font-medium w-32">MIME Type:</span>
                      <span className="text-sm">{message.mime_type || 'Unknown'}</span>
                    </div>
                    <div className="flex px-3 py-2">
                      <span className="text-sm font-medium w-32">Extension:</span>
                      <span className="text-sm">{message.extension || 'Unknown'}</span>
                    </div>
                    <div className="flex px-3 py-2">
                      <span className="text-sm font-medium w-32">File Size:</span>
                      <span className="text-sm">{message.file_size ? `${Math.round(message.file_size / 1024)} KB` : 'Unknown'}</span>
                    </div>
                    {(message.width || message.height) && (
                      <div className="flex px-3 py-2">
                        <span className="text-sm font-medium w-32">Dimensions:</span>
                        <span className="text-sm">{message.width || '?'}×{message.height || '?'}</span>
                      </div>
                    )}
                    {message.duration !== undefined && (
                      <div className="flex px-3 py-2">
                        <span className="text-sm font-medium w-32">Duration:</span>
                        <span className="text-sm">{`${Math.floor(message.duration / 60)}:${(message.duration % 60).toString().padStart(2, '0')}`}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Telegram Information:</h3>
                  <div className="rounded-md border divide-y">
                    <div className="flex px-3 py-2">
                      <span className="text-sm font-medium w-32">Message ID:</span>
                      <span className="text-sm">{message.telegram_message_id}</span>
                    </div>
                    <div className="flex px-3 py-2">
                      <span className="text-sm font-medium w-32">Chat ID:</span>
                      <span className="text-sm">{message.chat_id}</span>
                    </div>
                    <div className="flex px-3 py-2">
                      <span className="text-sm font-medium w-32">Chat Type:</span>
                      <span className="text-sm capitalize">{message.chat_type || 'Unknown'}</span>
                    </div>
                    {message.chat_title && (
                      <div className="flex px-3 py-2">
                        <span className="text-sm font-medium w-32">Chat Title:</span>
                        <span className="text-sm">{message.chat_title}</span>
                      </div>
                    )}
                    {message.media_group_id && (
                      <div className="flex px-3 py-2">
                        <span className="text-sm font-medium w-32">Media Group:</span>
                        <span className="text-sm truncate">{message.media_group_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Processing Information:</h3>
                <div className="rounded-md border divide-y">
                  <div className="flex px-3 py-2">
                    <span className="text-sm font-medium w-32">State:</span>
                    <span className="text-sm capitalize">{message.processing_state}</span>
                  </div>
                  {message.processing_started_at && (
                    <div className="flex px-3 py-2">
                      <span className="text-sm font-medium w-32">Started:</span>
                      <span className="text-sm">{format(new Date(message.processing_started_at), 'PPp')}</span>
                    </div>
                  )}
                  {message.processing_completed_at && (
                    <div className="flex px-3 py-2">
                      <span className="text-sm font-medium w-32">Completed:</span>
                      <span className="text-sm">{format(new Date(message.processing_completed_at), 'PPp')}</span>
                    </div>
                  )}
                  {message.processing_error && (
                    <div className="flex px-3 py-2">
                      <span className="text-sm font-medium w-32">Error:</span>
                      <span className="text-sm text-red-500">{message.processing_error}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {message.is_edited && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Edit History:</h3>
                  <div className="rounded-md border divide-y">
                    <div className="flex px-3 py-2">
                      <span className="text-sm font-medium w-32">Edited:</span>
                      <span className="text-sm">{message.edit_date ? format(new Date(message.edit_date), 'PPp') : 'Unknown'}</span>
                    </div>
                    {message.old_analyzed_content && (
                      <div className="flex px-3 py-2">
                        <span className="text-sm font-medium w-32">Previous Data:</span>
                        <span className="text-sm">
                          {JSON.stringify(message.old_analyzed_content, null, 2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {message.media_group_id && groupMessages.length > 1 && (
            <TabsContent value="group">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This message is part of a media group with {groupMessages.length} images.
                  {message.group_caption_synced && ' Caption data is synchronized across all images in this group.'}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupMessages.map((groupMsg) => (
                    <div 
                      key={groupMsg.id} 
                      className={`relative rounded-md border overflow-hidden ${groupMsg.id === message.id ? 'ring-2 ring-primary' : ''}`}
                    >
                      {groupMsg.public_url ? (
                        <img
                          src={groupMsg.public_url}
                          alt="Group media"
                          className="w-full aspect-square object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                      
                      {/* Current indicator */}
                      {groupMsg.id === message.id && (
                        <div className="absolute bottom-2 right-2">
                          <Badge>Current</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="raw">
            <ScrollArea className="h-[500px] rounded-md border">
              <pre className="p-4 text-xs">
                {JSON.stringify(message, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        <div className="w-full flex justify-between items-center">
          <span>
            Created: {message.created_at && format(new Date(message.created_at), 'PPp')}
          </span>
          <span>
            Last updated: {message.updated_at && format(new Date(message.updated_at), 'PPp')}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
