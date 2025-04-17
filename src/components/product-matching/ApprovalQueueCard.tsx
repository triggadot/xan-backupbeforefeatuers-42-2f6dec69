import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ApprovalQueueItem } from '@/hooks/telegram/useProductApprovalQueue';
import { ConfidenceScoreBadge } from './ConfidenceScoreBadge';
import { formatDistanceToNow } from 'date-fns';

interface ApprovalQueueCardProps {
  item: ApprovalQueueItem;
  isSelected: boolean;
  onSelect: (id: string, isSelected: boolean) => void;
  onApprove: (id: string, productId: string) => void;
  onReject: (id: string) => void;
  onViewDetails: (item: ApprovalQueueItem) => void;
  isProcessing?: boolean;
}

export const ApprovalQueueCard: React.FC<ApprovalQueueCardProps> = ({
  item,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onViewDetails,
  isProcessing = false,
}) => {
  const hasImage = Boolean(item.message_details?.public_url);
  const isVideo = item.message_details?.mime_type?.startsWith('video/');

  // Format the date as "X days/hours/minutes ago"
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  return (
    <Card className={`group overflow-hidden transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="p-3 pb-0 flex flex-row items-start gap-2">
        <div className="flex items-center">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={(checked) => onSelect(item.id, Boolean(checked))}
            className="data-[state=checked]:bg-primary" 
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium truncate">
              {item.suggested_product_name || 'Unnamed Product'}
            </h3>
            <ConfidenceScoreBadge score={item.best_match_score} />
          </div>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-2">
        {hasImage && (
          <div 
            className="relative aspect-square w-full mb-2 rounded-md overflow-hidden bg-muted cursor-pointer"
            onClick={() => onViewDetails(item)}
          >
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
          </div>
        )}

        <div className="space-y-1 text-sm">
          {item.suggested_vendor_uid && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vendor:</span>
              <span className="font-medium truncate max-w-[60%] text-right">{item.suggested_vendor_uid}</span>
            </div>
          )}
          {item.suggested_purchase_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Date:</span>
              <span className="font-medium">{new Date(item.suggested_purchase_date).toLocaleDateString()}</span>
            </div>
          )}
          {item.suggested_purchase_order_uid && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">PO#:</span>
              <span className="font-medium truncate max-w-[60%] text-right">{item.suggested_purchase_order_uid}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 gap-2 flex-wrap justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onViewDetails(item)}
          className="flex-1"
        >
          Details
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => onReject(item.id)}
          disabled={isProcessing}
          className="flex-1"
        >
          Reject
        </Button>
        {item.best_match_product_id && (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onApprove(item.id, item.best_match_product_id!)}
            disabled={isProcessing}
            className="flex-1"
          >
            Approve
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
