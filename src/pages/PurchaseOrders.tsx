
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PurchaseOrderWithVendor } from '@/types/purchaseOrder';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import PurchaseOrderList from '@/components/purchase-orders/list/PurchaseOrderList';

const PurchaseOrders: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithVendor[]>([]);
  const { fetchPurchaseOrders, isLoading, error } = usePurchaseOrders();
  const navigate = useNavigate();

  useEffect(() => {
    const loadPurchaseOrders = async () => {
      const data = await fetchPurchaseOrders();
      setPurchaseOrders(data);
    };
    
    loadPurchaseOrders();
  }, [fetchPurchaseOrders]);

  const handleViewPurchaseOrder = (id: string) => {
    navigate(`/purchase-orders/${id}`);
  };

  const handleCreatePurchaseOrder = () => {
    navigate('/purchase-orders/new');
  };

  return (
    <>
      <Helmet>
        <title>Purchase Orders | Glide Sync</title>
      </Helmet>
      <div className="container mx-auto py-6">
        <ScrollAnimation type="fade" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Purchase Orders</h1>
            <Button onClick={handleCreatePurchaseOrder} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Purchase Order
            </Button>
          </div>
          
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-2">Error Loading Purchase Orders</h2>
                <p className="text-muted-foreground">{String(error)}</p>
              </CardContent>
            </Card>
          ) : (
            <PurchaseOrderList
              purchaseOrders={purchaseOrders}
              onView={handleViewPurchaseOrder}
            />
          )}
        </ScrollAnimation>
      </div>
    </>
  );
};

export default PurchaseOrders;
