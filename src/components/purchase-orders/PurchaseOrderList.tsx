
import React from 'react';
import { PurchaseOrder } from '@/types/purchaseOrder';
import PurchaseOrderCard from './PurchaseOrderCard';
import { Spinner } from '@/components/ui/spinner';

interface PurchaseOrderListProps {
  purchaseOrders: PurchaseOrder[];
  isLoading: boolean;
  error: string | null;
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
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (purchaseOrders.length === 0) {
    return (
      <div className="bg-muted p-8 rounded-md text-center">
        <h3 className="font-medium text-lg mb-2">No purchase orders found</h3>
        <p className="text-muted-foreground">Create your first purchase order to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {purchaseOrders.map((purchaseOrder) => (
        <PurchaseOrderCard 
          key={purchaseOrder.id} 
          purchaseOrder={purchaseOrder} 
          onClick={() => onView(purchaseOrder.id)}
        />
      ))}
    </div>
  );
};

export default PurchaseOrderList;
