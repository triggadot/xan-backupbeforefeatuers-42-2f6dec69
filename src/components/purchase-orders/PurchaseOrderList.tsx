
import React from 'react';
import { PurchaseOrderWithVendor } from '@/types/purchaseOrder';
import PurchaseOrderCard from './PurchaseOrderCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';

interface PurchaseOrderListProps {
  purchaseOrders: PurchaseOrderWithVendor[];
  isLoading: boolean;
  error: Error | string | null;
  onViewPurchaseOrder: (purchaseOrder: PurchaseOrderWithVendor) => void;
  onCreatePurchaseOrder: () => void;
}

const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  purchaseOrders,
  isLoading,
  error,
  onViewPurchaseOrder,
  onCreatePurchaseOrder
}) => {
  if (isLoading && purchaseOrders.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, index) => (
          <Skeleton key={index} className="h-[200px] w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <h3 className="font-medium text-lg mb-2 text-destructive">Error Loading Purchase Orders</h3>
          <p className="text-muted-foreground mb-4">{typeof error === 'string' ? error : error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (purchaseOrders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <h3 className="font-medium text-lg mb-2">No purchase orders found</h3>
          <p className="text-muted-foreground mb-4">Create your first purchase order to get started.</p>
          <Button onClick={onCreatePurchaseOrder}>
            <Plus className="mr-2 h-4 w-4" /> Create Purchase Order
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {purchaseOrders.map((purchaseOrder) => (
        <PurchaseOrderCard
          key={purchaseOrder.id}
          purchaseOrder={purchaseOrder}
          onClick={() => onViewPurchaseOrder(purchaseOrder)}
        />
      ))}
    </div>
  );
};

export default PurchaseOrderList;
