/**
 * Component for matching Telegram media messages with products.
 * This provides a UI for finding and linking media to products.
 */
import React, { useState } from 'react';
import { useMediaMessages, useProductMatching } from '@/hooks/telegram';
import { MediaMessage } from '@/types/telegram/messages';
import { MatchedProduct, MatchType } from '@/hooks/telegram/useProductMatching';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MediaMessageList } from './MediaMessageList';
import { MediaMessageDetail } from './MediaMessageDetail';

interface ProductMediaMatcherProps {
  productId?: string;
  productGlideRowId?: string;
  onMediaSelected?: (media: MediaMessage) => void;
  onClose?: () => void;
}

/**
 * Component for matching Telegram media with products.
 * Can be used both for finding media for a specific product,
 * or for finding products that match a specific media message.
 */
export function ProductMediaMatcher({
  productId,
  productGlideRowId,
  onMediaSelected,
  onClose,
}: ProductMediaMatcherProps) {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MatchedProduct | null>(null);
  const [activeTab, setActiveTab] = useState('unmatched'); // 'unmatched', 'matched', 'all'
  
  // Hooks
  const { useMediaMessageDetail } = useMediaMessages();
  const {
    findProductMatches,
    linkMessageToProduct,
    useProductMedia,
    matchingInProgress,
  } = useProductMatching();
  
  // Get message detail if a message is selected
  const {
    data: selectedMessage,
    isLoading: messageLoading,
  } = useMediaMessageDetail(selectedMessageId || undefined);
  
  // Get product media if in product view mode
  const {
    data: productMedia = [],
    isLoading: productMediaLoading,
  } = useProductMedia(productGlideRowId, !!productGlideRowId);
  
  // Handle message selection
  const handleSelectMessage = (message: MediaMessage) => {
    setSelectedMessageId(message.id);
    findProductMatches.startMatching(message);
  };
  
  // Handle linking a message to a product
  const handleLinkToProduct = async (media: MediaMessage, product: MatchedProduct) => {
    try {
      await linkMessageToProduct.mutateAsync({
        messageId: media.id,
        productGlideRowId: product.glide_row_id,
        matchType: MatchType.MANUAL,
      });
      
      // If there's a callback, call it
      if (onMediaSelected) {
        onMediaSelected(media);
      }
      
      // Optionally close
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error linking message to product:', error);
      // Error handling would be added here (e.g., toast notification)
    }
  };
  
  // Clear selection
  const handleBack = () => {
    setSelectedMessageId(null);
    setSelectedProduct(null);
  };
  
  // Render media matches for a product
  const renderProductMediaMatches = () => {
    if (!productGlideRowId) return null;
    
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Media for Product</h2>
        
        {productMediaLoading ? (
          <p>Loading media...</p>
        ) : productMedia.length === 0 ? (
          <Alert>
            <AlertTitle>No media found</AlertTitle>
            <AlertDescription>
              This product doesn't have any linked media. Select from available media below.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productMedia.map((media) => (
              <Card 
                key={media.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedMessageId(media.id)}
              >
                <div className="aspect-square overflow-hidden">
                  {media.public_url ? (
                    <img 
                      src={media.public_url} 
                      alt="Product media" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted">
                      <span className="text-muted-foreground">No preview</span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <div className="text-xs text-muted-foreground truncate">
                    {media.media_type || 'unknown'}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        <Separator className="my-6" />
      </div>
    );
  };
  
  // Render product matches for a message
  const renderProductMatches = () => {
    if (!selectedMessage) return null;
    
    const { data: productMatches = [], isLoading: matchesLoading } = findProductMatches;
    
    return (
      <div className="space-y-4 mt-6">
        <h2 className="text-lg font-semibold">Potential Product Matches</h2>
        
        {matchingInProgress || matchesLoading ? (
          <p>Finding potential matches...</p>
        ) : productMatches.length === 0 ? (
          <Alert>
            <AlertTitle>No matches found</AlertTitle>
            <AlertDescription>
              No potential product matches were found for this media.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {productMatches.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="p-4 flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{product.display_name || product.vendor_product_name || 'Unnamed Product'}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      {product.product_purchase_date && (
                        <span className="mr-4">Purchase Date: {product.product_purchase_date}</span>
                      )}
                      {product.match_score && (
                        <Badge variant="outline">
                          Match Score: {product.match_score}
                        </Badge>
                      )}
                    </div>
                    {product.match_reason && (
                      <p className="text-xs text-muted-foreground mt-2">{product.match_reason}</p>
                    )}
                  </div>
                  
                  <Button 
                    size="sm"
                    onClick={() => handleLinkToProduct(selectedMessage, product)}
                    disabled={linkMessageToProduct.isPending}
                  >
                    {linkMessageToProduct.isPending ? 'Linking...' : 'Link to Product'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Render product media if in product view mode */}
      {productGlideRowId && renderProductMediaMatches()}
      
      {/* Selected media detail */}
      {selectedMessageId && selectedMessage ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Media Details</h2>
            <Button variant="outline" onClick={handleBack}>
              Back to List
            </Button>
          </div>
          
          <MediaMessageDetail
            messageId={selectedMessageId}
            onBack={handleBack}
          />
          
          {/* Product matches for this media */}
          {renderProductMatches()}
        </div>
      ) : (
        /* Media list for selection */
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="unmatched">Unmatched Media</TabsTrigger>
              <TabsTrigger value="matched">Matched Media</TabsTrigger>
              <TabsTrigger value="all">All Media</TabsTrigger>
            </TabsList>
            
            <TabsContent value="unmatched">
              <MediaMessageList
                withCaption={true}
                onSelectMessage={handleSelectMessage}
                title="Unmatched Media with Caption"
              />
            </TabsContent>
            
            <TabsContent value="matched">
              <p className="text-muted-foreground mb-4">
                Media that has already been linked to products.
              </p>
              <MediaMessageList
                withCaption={true}
                onSelectMessage={handleSelectMessage}
                title="Matched Media"
              />
            </TabsContent>
            
            <TabsContent value="all">
              <MediaMessageList
                onSelectMessage={handleSelectMessage}
                title="All Media"
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
