import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { PurchaseOrderFilters, PurchaseOrderWithVendor } from '@/types/purchaseOrder';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import PurchaseOrderCard from '@/components/purchase-orders/PurchaseOrderCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const { fetchPurchaseOrders, isLoading } = usePurchaseOrders();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithVendor[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      const result = await fetchPurchaseOrders();
      if (!result.error && result.data) {
        // Transform the data to match PurchaseOrderWithVendor
        const transformedData: PurchaseOrderWithVendor[] = result.data.map(po => ({
          id: po.id,
          number: po.number || po.purchase_order_uid || '',
          date: new Date(po.po_date || po.date || new Date()),
          status: po.status,
          vendorId: po.vendorId || po.vendor_uid || '',
          vendorName: po.vendorName || 'Vendor',
          total: po.total_amount,
          balance: po.balance,
          paymentCount: 0,
          createdAt: new Date(po.created_at || new Date()),
          updatedAt: new Date(po.updated_at || new Date()),
          productCount: 0,
          totalPaid: po.total_paid
        }));
        setPurchaseOrders(transformedData);
      }
    } catch (error) {
      console.error("Error loading purchase orders:", error);
      toast({
        title: "Error",
        description: "Failed to load purchase orders",
        variant: "destructive"
      });
    }
  };

  const handleCreatePurchaseOrder = () => {
    navigate('/purchase-orders/new');
  };

  const handleViewPurchaseOrder = (id: string) => {
    navigate(`/purchase-orders/${id}`);
  };

  const handlePurchaseOrderClick = (purchaseOrder: PurchaseOrderWithVendor) => {
    navigate(`/purchase-orders/${purchaseOrder.id}`);
  };

  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    if (activeTab === 'all') return true;
    if (activeTab === 'draft') return po.status === 'draft';
    if (activeTab === 'received') return po.status === 'received';
    if (activeTab === 'partial') return po.status === 'partial';
    if (activeTab === 'complete') return po.status === 'complete';
    return true;
  });

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
        <Button onClick={handleCreatePurchaseOrder}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Purchase Order
        </Button>
      </div>

      <Tabs 
        defaultValue="all" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="partial">Partial</TabsTrigger>
          <TabsTrigger value="complete">Complete</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredPurchaseOrders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No purchase orders found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPurchaseOrders.map((po) => (
                <PurchaseOrderCard 
                  key={po.id} 
                  purchaseOrder={po} 
                  onClick={() => handlePurchaseOrderClick(po)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
