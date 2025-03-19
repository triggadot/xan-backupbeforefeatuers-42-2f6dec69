import React, { useState, useEffect } from 'react';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { PurchaseOrderList } from '@/components/purchase-orders/PurchaseOrderList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PurchaseOrder } from '@/types/purchaseOrder';

const PurchaseOrders: React.FC = () => {
  const { 
    purchaseOrders, 
    isLoading, 
    error, 
    fetchPurchaseOrders 
  } = usePurchaseOrders();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);
  
  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);
  
  const handleCreatePurchaseOrder = () => {
    setIsCreateDialogOpen(true);
  };
  
  const handleEditPurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setIsEditDialogOpen(true);
  };
  
  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };
  
  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedPurchaseOrder(null);
  };
  
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        <p>Error loading purchase orders: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <Button onClick={handleCreatePurchaseOrder}>
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </Button>
      </div>
      
      <PurchaseOrderList 
        purchaseOrders={purchaseOrders as PurchaseOrder[]}
        isLoading={isLoading} 
        onEdit={handleEditPurchaseOrder}
      />
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          {/* Implement PurchaseOrderForm here */}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Purchase Order</DialogTitle>
          </DialogHeader>
          {/* Implement PurchaseOrderForm here with the selectedPurchaseOrder */}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;
