import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ApprovalQueueItem } from '@/hooks/telegram/useProductApprovalQueue';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ConfidenceScoreBadge } from './ConfidenceScoreBadge';
import { formatDistanceToNow } from 'date-fns';

interface SortableQueueItemProps {
  item: ApprovalQueueItem;
  onClick: () => void;
}

export const SortableQueueItem: React.FC<SortableQueueItemProps> = ({ item, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const hasImage = Boolean(item.message_details?.public_url);
  const isVideo = item.message_details?.mime_type?.startsWith('video/');
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`group overflow-hidden transition-all duration-200 cursor-grab hover:shadow-md hover:border-primary/40 ${isDragging ? 'shadow-lg' : ''}`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Prevent click from firing when dragging ends
        if (isDragging) return;
        onClick();
      }}
    >
      <div className="relative p-0">
        {hasImage && (
          <div className="relative aspect-square w-full bg-muted">
            {isVideo ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <img 
                  src={item.message_details.public_url} 
                  alt={item.suggested_product_name || 'Product image'}
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
              </div>
            ) : (
              <img 
                src={item.message_details.public_url} 
                alt={item.suggested_product_name || 'Product image'}
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Confidence score badge */}
            <div className="absolute top-2 right-2">
              <ConfidenceScoreBadge score={item.best_match_score} />
            </div>
            
            {/* Drag handle indicator */}
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-background/80 backdrop-blur-sm rounded-md p-1">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                  <path d="M5.5 4.625C5.5 4.97018 5.22018 5.25 4.875 5.25C4.52982 5.25 4.25 4.97018 4.25 4.625C4.25 4.27982 4.52982 4 4.875 4C5.22018 4 5.5 4.27982 5.5 4.625ZM5.5 7.625C5.5 7.97018 5.22018 8.25 4.875 8.25C4.52982 8.25 4.25 7.97018 4.25 7.625C4.25 7.27982 4.52982 7 4.875 7C5.22018 7 5.5 7.27982 5.5 7.625ZM5.5 10.625C5.5 10.9702 5.22018 11.25 4.875 11.25C4.52982 11.25 4.25 10.9702 4.25 10.625C4.25 10.2798 4.52982 10 4.875 10C5.22018 10 5.5 10.2798 5.5 10.625ZM10.5 4.625C10.5 4.97018 10.2202 5.25 9.875 5.25C9.52982 5.25 9.25 4.97018 9.25 4.625C9.25 4.27982 9.52982 4 9.875 4C10.2202 4 10.5 4.27982 10.5 4.625ZM10.5 7.625C10.5 7.97018 10.2202 8.25 9.875 8.25C9.52982 8.25 9.25 7.97018 9.25 7.625C9.25 7.27982 9.52982 7 9.875 7C10.2202 7 10.5 7.27982 10.5 7.625ZM10.5 10.625C10.5 10.9702 10.2202 11.25 9.875 11.25C9.52982 11.25 9.25 10.9702 9.25 10.625C9.25 10.2798 9.52982 10 9.875 10C10.2202 10 10.5 10.2798 10.5 10.625Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </div>
            </div>
          </div>
        )}
        
        <CardContent className="p-3">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium line-clamp-2">
              {item.suggested_product_name || 'Unnamed Product'}
            </h3>
          </div>
          
          <div className="mt-1 text-xs text-muted-foreground">
            {timeAgo}
          </div>
          
          {item.suggested_vendor_uid && (
            <div className="mt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Vendor:</span>
                <span className="font-medium text-xs truncate max-w-[60%] text-right">
                  {item.suggested_vendor_uid}
                </span>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-3 pt-0 text-xs text-muted-foreground">
          {item.status === 'pending' ? (
            <span className="flex items-center">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              Drag to approve or reject
            </span>
          ) : (
            <span className="flex items-center">
              {item.status === 'approved' && (
                <svg className="h-3 w-3 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {item.status === 'rejected' && (
                <svg className="h-3 w-3 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {item.status === 'auto_matched' && (
                <svg className="h-3 w-3 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
            </span>
          )}
        </CardFooter>
      </div>
    </Card>
  );
};
