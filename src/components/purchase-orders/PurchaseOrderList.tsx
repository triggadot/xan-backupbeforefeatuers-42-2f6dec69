
import React from 'react';
import { PurchaseOrder, PurchaseOrderWithVendor } from '@/types/purchaseOrder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PurchaseOrderListProps {
  purchaseOrders: PurchaseOrderWithVendor[];
  isLoading: boolean;
  error: Error | string | null;
  onView: (id: string) => void;
}

const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  purchaseOrders,
  isLoading,
  error,
  onView
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle><Skeleton className="h-4 w-[200px]" /></CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 text-destructive">
        {(error as Error).message || String(error)}
      </div>
    );
  }

  if (purchaseOrders.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No purchase orders found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {purchaseOrders.map((purchaseOrder) => (
        <Card
          key={purchaseOrder.id}
          className="cursor-pointer hover:bg-secondary transition-colors"
          onClick={() => onView(purchaseOrder.id)}
        >
          <CardHeader>
            <CardTitle>{purchaseOrder.number}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Vendor: {purchaseOrder.vendorName}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PurchaseOrderList;
