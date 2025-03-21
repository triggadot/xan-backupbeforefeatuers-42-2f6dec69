
import React, { useState } from 'react';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PurchaseOrderForm } from '@/components/purchase-orders/PurchaseOrderForm';
import PurchaseOrderList from '@/components/purchase-orders/PurchaseOrderList';
import { PurchaseOrderFilters } from '@/components/purchase-orders/PurchaseOrderFilters';
import { PurchaseOrderFilters as PurchaseOrderFiltersType, PurchaseOrderWithVendor } from '@/types/purchaseOrder';

const PurchaseOrders: React.FC = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrderWithVendor | null>(null);
  const { fetchPurchaseOrders, isLoading, error } = usePurchaseOrders();
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrderWithVendor[]>([]);
  const [filters, setFilters] = useState<PurchaseOrderFiltersType>({});

  React.useEffect(() => {
    const getPurchaseOrders = async () => {
      const { data } = await fetchPurchaseOrders(filters);
      setPurchaseOrders(data || []);
    };

    getPurchaseOrders();
  }, [fetchPurchaseOrders, filters]);

  const handleOpenSheet = () => {
    setIsEditMode(false);
    setSelectedPurchaseOrder(null);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
  };

  const handleEditPurchaseOrder = (purchaseOrder: PurchaseOrderWithVendor) => {
    setIsEditMode(true);
    setSelectedPurchaseOrder(purchaseOrder);
    setIsSheetOpen(true);
  };

  const handleFiltersChange = (newFilters: PurchaseOrderFiltersType) => {
    setFilters(newFilters);
  };

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <Button onClick={handleOpenSheet}>
          <Plus className="h-4 w-4 mr-2" />
          Add Purchase Order
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="partial">Partial</TabsTrigger>
          <TabsTrigger value="complete">Complete</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <PurchaseOrderFilters onChange={handleFiltersChange} />
          <PurchaseOrderList
            purchaseOrders={purchaseOrders}
            isLoading={isLoading}
            error={error}
            onView={handleEditPurchaseOrder}
          />
        </TabsContent>
        <TabsContent value="draft">
          <PurchaseOrderList
            purchaseOrders={purchaseOrders.filter(po => po.status === 'draft')}
            isLoading={isLoading}
            error={error}
            onView={handleEditPurchaseOrder}
          />
        </TabsContent>
        <TabsContent value="sent">
          <PurchaseOrderList
            purchaseOrders={purchaseOrders.filter(po => po.status === 'sent')}
            isLoading={isLoading}
            error={error}
            onView={handleEditPurchaseOrder}
          />
        </TabsContent>
        <TabsContent value="partial">
          <PurchaseOrderList
            purchaseOrders={purchaseOrders.filter(po => po.status === 'partial')}
            isLoading={isLoading}
            error={error}
            onView={handleEditPurchaseOrder}
          />
        </TabsContent>
        <TabsContent value="complete">
          <PurchaseOrderList
            purchaseOrders={purchaseOrders.filter(po => po.status === 'complete')}
            isLoading={isLoading}
            error={error}
            onView={handleEditPurchaseOrder}
          />
        </TabsContent>
      </Tabs>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}</SheetTitle>
          </SheetHeader>
          <PurchaseOrderForm
            initialData={selectedPurchaseOrder}
            isEdit={isEditMode}
            onClose={handleCloseSheet}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PurchaseOrders;
