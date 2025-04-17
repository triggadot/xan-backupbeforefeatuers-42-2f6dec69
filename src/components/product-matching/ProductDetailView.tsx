import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ConfidenceScoreBadge } from './ConfidenceScoreBadge';
import { ApprovalQueueItem } from '@/hooks/telegram/useProductApprovalQueue';
import { ProductMatch } from '@/types/telegram/product-matching';

interface ProductDetailViewProps {
  item: ApprovalQueueItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, productId: string) => void;
  onReject: (id: string, reason?: string) => void;
  isProcessing?: boolean;
  potentialMatches?: ProductMatch[];
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  item,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isProcessing = false,
  potentialMatches = []
}) => {
  const [rejectReason, setRejectReason] = React.useState('');
  
  if (!item) return null;
  
  const hasImage = Boolean(item.message_details?.public_url);
  const isVideo = item.message_details?.mime_type?.startsWith('video/');
  const bestMatch = potentialMatches.length > 0 ? potentialMatches[0] : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{item.suggested_product_name || 'Unnamed Product'}</span>
            {item.best_match_score && (
              <ConfidenceScoreBadge score={item.best_match_score} />
            )}
          </DialogTitle>
          <DialogDescription>
            Product match details and approval options
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Media Preview */}
          <div>
            {hasImage && (
              <div className="aspect-square relative rounded-md overflow-hidden bg-muted">
                {isVideo ? (
                  <video 
                    src={item.message_details.public_url} 
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img 
                    src={item.message_details.public_url} 
                    alt={item.suggested_product_name || 'Product image'}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}
            
            {item.message_details?.caption && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-1">Caption:</h3>
                <p className="text-sm p-3 bg-muted rounded-md whitespace-pre-wrap">
                  {item.message_details.caption}
                </p>
              </div>
            )}
          </div>
          
          {/* Product Details and Matches */}
          <div>
            <Tabs defaultValue="details">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                <TabsTrigger value="matches" className="flex-1">
                  Matches ({potentialMatches.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Vendor</p>
                      <p className="font-medium">{item.suggested_vendor_uid || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Purchase Date</p>
                      <p className="font-medium">
                        {item.suggested_purchase_date 
                          ? new Date(item.suggested_purchase_date).toLocaleDateString() 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Purchase Order</p>
                      <p className="font-medium">{item.suggested_purchase_order_uid || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                {bestMatch && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">Best Match:</h3>
                    <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{bestMatch.display_name || bestMatch.new_product_name || bestMatch.vendor_product_name}</span>
                        <ConfidenceScoreBadge score={bestMatch.match_score} />
                      </div>
                      
                      <div className="text-sm space-y-1 mt-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vendor Product Name:</span>
                          <span>{bestMatch.vendor_product_name}</span>
                        </div>
                        {bestMatch.product_purchase_date && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Purchase Date:</span>
                            <span>{new Date(bestMatch.product_purchase_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {bestMatch.match_reasons && (
                        <div className="mt-3 text-sm">
                          <p className="text-muted-foreground font-medium">Match Reasons:</p>
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            {bestMatch.match_reasons.vendor_matched && (
                              <li>Vendor matched</li>
                            )}
                            {bestMatch.match_reasons.purchase_date_match && (
                              <li>Purchase date: {bestMatch.match_reasons.purchase_date_match}</li>
                            )}
                            {bestMatch.match_reasons.product_name_match && (
                              <li>Product name matched in {bestMatch.match_reasons.product_name_match}</li>
                            )}
                            {bestMatch.match_reasons.purchase_order_match && (
                              <li>Purchase order matched</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="matches" className="mt-4">
                {potentialMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No potential matches found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {potentialMatches.map((match, index) => (
                      <div 
                        key={match.id} 
                        className={`p-3 rounded-md ${index === 0 ? 'bg-primary/10 border-primary/20 border' : 'bg-muted/50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{match.display_name || match.new_product_name || match.vendor_product_name}</span>
                          <div className="flex items-center gap-2">
                            <ConfidenceScoreBadge score={match.match_score} />
                            <Button 
                              size="sm" 
                              disabled={isProcessing}
                              onClick={() => onApprove(item.id, match.glide_row_id)}
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-sm space-y-1 mt-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vendor Product Name:</span>
                            <span>{match.vendor_product_name}</span>
                          </div>
                          {match.product_purchase_date && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Purchase Date:</span>
                              <span>{new Date(match.product_purchase_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Action Buttons */}
            <div className="flex justify-between mt-6 gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  onClick={() => onReject(item.id, rejectReason)}
                  disabled={isProcessing}
                >
                  Reject
                </Button>
                
                {bestMatch && (
                  <Button 
                    variant="default" 
                    onClick={() => onApprove(item.id, bestMatch.glide_row_id)}
                    disabled={isProcessing}
                  >
                    Approve Best Match
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
