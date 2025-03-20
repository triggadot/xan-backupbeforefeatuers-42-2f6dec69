
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import PurchaseOrderList from '@/components/purchase-orders/PurchaseOrderList';
import PurchaseOrderFilters from '@/components/purchase-orders/PurchaseOrderFilters';
import { PurchaseOrderFilters as FilterType } from '@/types/purchaseOrder';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PurchaseOrderForm from '@/components/purchase-orders/PurchaseOrderForm';
import { useToast } from '@/hooks/use-toast';

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterType>({});

  const { 
    purchaseOrders, 
    isLoading, 
    error, 
    fetchPurchaseOrders,
    createPurchaseOrder 
  } = usePurchaseOrders(filters);

  const handleCreatePurchaseOrder = async (data: any) => {
    try {
      await createPurchaseOrder.mutateAsync(data);
      setIsCreateDialogOpen(false);
      fetchPurchaseOrders();
      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    }
  };

  const handleViewPurchaseOrder = (id: string) => {
    navigate(`/purchase-orders/${id}`);
  };

  return (
    <div className="container py-6 space-y-6 animate-enter-bottom">
      <Helmet>
        <title>Purchase Orders | Billow</title>
      </Helmet>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage vendor purchase orders and inventory
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-1 h-4 w-4" /> New Purchase Order
        </Button>
      </div>

      <PurchaseOrderFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      <PurchaseOrderList
        purchaseOrders={purchaseOrders}
        isLoading={isLoading}
        error={error as string}
        onView={handleViewPurchaseOrder}
      />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
          </DialogHeader>
          <PurchaseOrderForm onSubmit={handleCreatePurchaseOrder} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;
