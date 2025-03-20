
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusIcon, RefreshCw } from 'lucide-react';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { PurchaseOrderFilters } from '@/types/purchaseOrder';
import { PurchaseOrderForm } from '@/components/purchase-orders/PurchaseOrderForm';
import { PurchaseOrderList } from '@/components/purchase-orders/PurchaseOrderList';

// Update the import for PurchaseOrderFilters component
// import { PurchaseOrderFilters } from '@/components/purchase-orders/PurchaseOrderFilters';

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const { fetchPurchaseOrders, createPurchaseOrder, isLoading, error } = usePurchaseOrders();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});

  useEffect(() => {
    loadPurchaseOrders();
  }, [filters]);

  const loadPurchaseOrders = async () => {
    const result = await fetchPurchaseOrders(); // No need to pass filters here
    if (result?.data) {
      setPurchaseOrders(result.data);
    }
  };

  const handleCreatePurchaseOrder = async (data: any) => {
    try {
      await createPurchaseOrder(data);
      setIsCreateDialogOpen(false);
      loadPurchaseOrders();
    } catch (err) {
      console.error('Error creating purchase order:', err);
    }
  };

  const handleViewPurchaseOrder = (id: string) => {
    navigate(`/purchase-orders/${id}`);
  };

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadPurchaseOrders}
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* Temporarily comment out filters until we fix the component
      <PurchaseOrderFilters
        filters={filters}
        onFiltersChange={setFilters}
      />
      */}

      <div className="mt-6">
        <PurchaseOrderList
          purchaseOrders={purchaseOrders}
          isLoading={isLoading}
          error={error ? String(error) : null}
          onView={handleViewPurchaseOrder}
        />
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
          </DialogHeader>
          {/* Pass onSubmit properly */}
          <PurchaseOrderForm 
            onSubmit={handleCreatePurchaseOrder}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;
