/**
 * Component for displaying a single Telegram media message as a card.
 */
import React from 'react';
import { format } from 'date-fns';
import { MediaMessage } from '@/types/telegram/messages';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MediaMessageCardProps {
  message: MediaMessage;
  onClick?: () => void;
  showFullCaption?: boolean;
}

/**
 * Card component to display a Telegram media message with image preview and metadata.
 */
export function MediaMessageCard({
  message,
  onClick,
  showFullCaption = false,
}: MediaMessageCardProps) {
  // Extract product name from caption data if available
  const productName = message.caption_data?.product_name || 
                     message.analyzed_content?.product_name || 
                     'Unnamed Product';
  
  // Format the caption for display
  const displayCaption = showFullCaption
    ? message.caption
    : message.caption && message.caption.length > 100
      ? `${message.caption.substring(0, 100)}...`
      : message.caption;
  
  // Determine if image has product data
  const hasProductData = !!(message.caption_data?.product_name || 
                           message.caption_data?.product_code ||
                           message.caption_data?.vendor_uid);
  
  return (
    <Card 
      className={`overflow-hidden hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {message.public_url ? (
          <img
            src={message.public_url}
            alt={productName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-muted-foreground">No image available</span>
          </div>
        )}
        
        {/* Processing state badge */}
        {message.processing_state !== 'completed' && (
          <div className="absolute top-2 right-2">
            <Badge 
              variant={message.processing_state === 'error' ? 'destructive' : 'secondary'}
            >
              {message.processing_state}
            </Badge>
          </div>
        )}
        
        {/* Product data indicator */}
        {hasProductData && (
          <div className="absolute top-2 left-2">
            <Badge variant="success" className="bg-green-500">
              Product Data
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-3">
        <h3 className="font-medium line-clamp-1" title={productName}>
          {productName}
        </h3>
        
        {displayCaption && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {displayCaption}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="p-3 pt-0 text-xs text-muted-foreground">
        <div className="flex justify-between items-center w-full">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span>
                  {message.created_at && format(new Date(message.created_at), 'MMM d, yyyy')}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {message.created_at && format(new Date(message.created_at), 'PPpp')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {message.media_type && (
            <span className="capitalize">{message.media_type}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
