import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApprovalQueueItem } from '@/hooks/telegram/useProductApprovalQueue';

interface ProductDropZoneProps {
  id: string;
  title: string;
  description: string;
  items?: ApprovalQueueItem[];
  onItemClick?: (item: ApprovalQueueItem) => void;
  className?: string;
}

export const ProductDropZone: React.FC<ProductDropZoneProps> = ({
  id,
  title,
  description,
  items = [],
  onItemClick,
  className = '',
}) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <Card 
      ref={setNodeRef} 
      className={`${className} transition-all duration-200 ${isOver ? 'ring-2 ring-primary scale-[1.02]' : ''}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {items && items.length > 0 && (
            <Badge variant="secondary">{items.length}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      
      {items && items.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {items.slice(0, 5).map(item => (
              <div 
                key={item.id}
                className="relative group"
              >
                {item.message_details?.public_url ? (
                  <div 
                    className="w-14 h-14 rounded-md overflow-hidden bg-muted cursor-pointer border border-muted hover:border-primary transition-all"
                    onClick={() => onItemClick?.(item)}
                  >
                    <img 
                      src={item.message_details.public_url} 
                      alt={item.suggested_product_name || 'Product image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-14 h-14 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground cursor-pointer"
                    onClick={() => onItemClick?.(item)}
                  >
                    {(item.suggested_product_name || 'Product').substring(0, 2).toUpperCase()}
                  </div>
                )}
                
                <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    {items.indexOf(item) + 1}
                  </Badge>
                </div>
              </div>
            ))}
            
            {items.length > 5 && (
              <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{items.length - 5}
              </div>
            )}
          </div>
        </CardContent>
      )}
      
      {(!items || items.length === 0) && isOver && (
        <CardContent>
          <div className="h-14 flex items-center justify-center text-primary border-2 border-dashed border-primary rounded-md">
            <p className="text-sm">Drop here</p>
          </div>
        </CardContent>
      )}
      
      {(!items || items.length === 0) && !isOver && (
        <CardContent>
          <div className="h-14 flex items-center justify-center text-muted-foreground border border-dashed border-muted rounded-md">
            <p className="text-sm">Drag items here</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
