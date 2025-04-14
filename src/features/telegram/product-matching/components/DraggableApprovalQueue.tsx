import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApprovalQueueItem } from '@/hooks/telegram/useProductApprovalQueue';
import { SortableQueueItem } from './SortableQueueItem';
import { ProductDropZone } from './ProductDropZone';
import { ProductDetailView } from './ProductDetailView';
import { NewProductData, ProductMatch } from '@/types/telegram/product-matching';

interface DraggableApprovalQueueProps {
  items: ApprovalQueueItem[];
  potentialMatches: Record<string, ProductMatch[]>;
  onApprove: (id: string, productId: string) => void;
  onReject: (id: string, reason?: string) => void;
  onCreateProduct: (id: string, productData: NewProductData) => void;
  isProcessing?: boolean;
}

export const DraggableApprovalQueue: React.FC<DraggableApprovalQueueProps> = ({
  items,
  potentialMatches,
  onApprove,
  onReject,
  onCreateProduct,
  isProcessing = false,
}) => {
  const [activeItem, setActiveItem] = useState<ApprovalQueueItem | null>(null);
  const [detailItem, setDetailItem] = useState<ApprovalQueueItem | null>(null);
  
  // Group items by vendor for the drop zones
  const vendorGroups = React.useMemo(() => {
    const groups: Record<string, ApprovalQueueItem[]> = {};
    items.forEach(item => {
      const vendorId = item.suggested_vendor_uid || 'Unknown';
      if (!groups[vendorId]) {
        groups[vendorId] = [];
      }
      groups[vendorId].push(item);
    });
    return groups;
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // 10px of movement before drag starts
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    const item = items.find(item => item.id === id) || null;
    setActiveItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id !== active.id) {
      // Handle dropping on a product zone
      if (typeof over.id === 'string' && over.id.startsWith('product-')) {
        const productId = over.id.replace('product-', '');
        onApprove(active.id as string, productId);
      }
      // Handle dropping on the reject zone
      else if (over.id === 'reject-zone') {
        onReject(active.id as string);
      }
      // Handle dropping on create new product zone
      else if (over.id === 'create-zone') {
        const item = items.find(item => item.id === active.id);
        if (item) {
          const newProductData: NewProductData = {
            product_name: item.suggested_product_name || 'New Product',
            vendor_id: item.suggested_vendor_uid,
            purchase_date: item.suggested_purchase_date,
            purchase_order_id: item.suggested_purchase_order_uid,
          };
          onCreateProduct(item.id, newProductData);
        }
      }
    }
    
    setActiveItem(null);
  };

  const openDetailView = (item: ApprovalQueueItem) => {
    setDetailItem(item);
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Main Queue (Draggable items) */}
          <div className="flex-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Product Approval Queue</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drag items to appropriate zones or click for details
                </p>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No items in queue</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <SortableContext items={items.map(item => item.id)} strategy={rectSortingStrategy}>
                      {items.map(item => (
                        <SortableQueueItem 
                          key={item.id} 
                          item={item}
                          onClick={() => openDetailView(item)}
                        />
                      ))}
                    </SortableContext>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Drop Zones */}
          <div className="w-full lg:w-72 space-y-4">
            {/* Approve Zone with best matching products */}
            <ProductDropZone 
              id="approve-zone"
              title="Approve"
              description="Drop items here to approve with best match"
              items={items.filter(item => item.best_match_product_id)}
              onItemClick={openDetailView}
              className="border-green-200 bg-green-50 dark:bg-green-950/20"
            />

            {/* Reject Zone */}
            <ProductDropZone 
              id="reject-zone"
              title="Reject"
              description="Drop items here to reject"
              className="border-red-200 bg-red-50 dark:bg-red-950/20"
            />

            {/* Create New Product Zone */}
            <ProductDropZone 
              id="create-zone"
              title="Create New Product"
              description="Drop items here to create a new product"
              className="border-blue-200 bg-blue-50 dark:bg-blue-950/20"
            />
          </div>
        </div>

        {/* Vendor-Based Product Groups */}
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold">Group by Vendor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(vendorGroups).map(([vendor, vendorItems]) => (
              <Card key={vendor}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{vendor}</CardTitle>
                    <Badge variant="secondary">{vendorItems.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {vendorItems.slice(0, 5).map(item => (
                      <Button 
                        key={item.id} 
                        variant="outline" 
                        size="sm"
                        className="text-xs h-auto py-1"
                        onClick={() => openDetailView(item)}
                      >
                        {item.suggested_product_name || 'Unnamed'}
                      </Button>
                    ))}
                    {vendorItems.length > 5 && (
                      <Badge variant="outline">
                        +{vendorItems.length - 5} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {detailItem && (
        <ProductDetailView 
          item={detailItem}
          isOpen={!!detailItem}
          onClose={() => setDetailItem(null)}
          onApprove={onApprove}
          onReject={onReject}
          isProcessing={isProcessing}
          potentialMatches={potentialMatches[detailItem.id] || []}
        />
      )}

      {/* Drag overlay for visual feedback */}
      {activeItem && activeItem.message_details.public_url && (
        <div className="fixed top-0 left-0 pointer-events-none z-50">
          <div className="w-24 h-24 rounded-md overflow-hidden bg-background shadow-md border border-primary">
            <img 
              src={activeItem.message_details.public_url} 
              alt="Dragging" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </DndContext>
  );
};
