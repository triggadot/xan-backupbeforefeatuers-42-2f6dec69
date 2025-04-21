import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApprovalQueueItem } from '@/hooks/telegram/useProductApprovalQueue';

interface BatchApprovalPanelProps {
  selectedItems: string[];
  items: ApprovalQueueItem[];
  onApproveAll: (ids: string[], productId: string) => void;
  onRejectAll: (ids: string[], reason?: string) => void;
  isProcessing?: boolean;
}

export const BatchApprovalPanel: React.FC<BatchApprovalPanelProps> = ({
  selectedItems,
  items,
  onApproveAll,
  onRejectAll,
  isProcessing = false,
}) => {
  const [showBatchApproveDialog, setShowBatchApproveDialog] = useState(false);
  const [showBatchRejectDialog, setShowBatchRejectDialog] = useState(false);
  const [productId, setProductId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  
  // Get the selected items' details
  const selectedItemsDetails = items.filter(item => selectedItems.includes(item.id));
  
  // Group by vendor
  const vendorGroups = React.useMemo(() => {
    const groups: Record<string, number> = {};
    selectedItemsDetails.forEach(item => {
      const vendor = item.suggested_vendor_uid || 'Unknown';
      groups[vendor] = (groups[vendor] || 0) + 1;
    });
    return groups;
  }, [selectedItemsDetails]);
  
  // Group by purchase order
  const poGroups = React.useMemo(() => {
    const groups: Record<string, number> = {};
    selectedItemsDetails.forEach(item => {
      if (item.suggested_purchase_order_uid) {
        groups[item.suggested_purchase_order_uid] = (groups[item.suggested_purchase_order_uid] || 0) + 1;
      }
    });
    return groups;
  }, [selectedItemsDetails]);

  const handleBatchApprove = () => {
    if (!productId.trim()) return;
    onApproveAll(selectedItems, productId);
    setShowBatchApproveDialog(false);
    setProductId('');
  };

  const handleBatchReject = () => {
    onRejectAll(selectedItems, rejectReason);
    setShowBatchRejectDialog(false);
    setRejectReason('');
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="shadow-md border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Batch Operations</span>
            <Badge>{selectedItems.length} selected</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm">
              <p className="text-muted-foreground">Selected items by vendor:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(vendorGroups).map(([vendor, count]) => (
                  <Badge key={vendor} variant="outline" className="flex gap-1">
                    {vendor} <span className="bg-primary/10 px-1 rounded-sm">{count}</span>
                  </Badge>
                ))}
              </div>
            </div>
            
            {Object.keys(poGroups).length > 0 && (
              <div className="text-sm">
                <p className="text-muted-foreground">Selected items by purchase order:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(poGroups).map(([po, count]) => (
                    <Badge key={po} variant="outline" className="flex gap-1">
                      PO: {po} <span className="bg-primary/10 px-1 rounded-sm">{count}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <Separator />
            
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowBatchRejectDialog(true)}
                disabled={isProcessing}
              >
                Reject All
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowBatchApproveDialog(true)}
                disabled={isProcessing}
              >
                Approve All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Batch Approve Dialog */}
      <Dialog open={showBatchApproveDialog} onOpenChange={setShowBatchApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {selectedItems.length} Items</DialogTitle>
            <DialogDescription>
              Assign all selected items to the same product
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Product ID</Label>
              <Input 
                id="productId" 
                placeholder="Enter glide_row_id of the product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
            </div>
            
            <Alert>
              <AlertDescription>
                This will approve {selectedItems.length} items and link them to the same product.
                Make sure all selected items represent the same product.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchApproveDialog(false)}>Cancel</Button>
            <Button onClick={handleBatchApprove} disabled={!productId.trim() || isProcessing}>
              Approve All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Batch Reject Dialog */}
      <Dialog open={showBatchRejectDialog} onOpenChange={setShowBatchRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {selectedItems.length} Items</DialogTitle>
            <DialogDescription>
              Provide an optional reason for rejecting these items
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason (Optional)</Label>
              <Textarea
                id="rejectReason"
                placeholder="Enter reason for rejection"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBatchReject} disabled={isProcessing}>
              Reject All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
