
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PurchaseOrder } from '@/types/purchase-orders';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import PurchaseOrderForm from '@/components/purchase-orders/form/PurchaseOrderForm';

const PurchaseOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const { getPurchaseOrder, isLoading, error, updatePurchaseOrder } = usePurchaseOrders();

  useEffect(() => {
    const loadPurchaseOrder = async () => {
      if (id) {
        const po = await getPurchaseOrder(id);
        setPurchaseOrder(po);
      }
    };

    loadPurchaseOrder();
  }, [id, getPurchaseOrder]);

  const handleBack = () => {
    navigate('/purchase-orders');
  };

  const handleUpdate = async (data: PurchaseOrder) => {
    if (id) {
      await updatePurchaseOrder(id, data);
      navigate('/purchase-orders');
    }
  };

  return (
    <>
      <Helmet>
        <title>{purchaseOrder?.number || 'Purchase Order'} | Glide Sync</title>
      </Helmet>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button onClick={handleBack} variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Purchase Orders
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
              <h2 className="text-xl font-semibold mb-2">Error Loading Purchase Order</h2>
              <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
            </CardContent>
          </Card>
        ) : purchaseOrder ? (
          <PurchaseOrderForm
            purchaseOrder={purchaseOrder}
            onSubmit={handleUpdate}
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Purchase Order Not Found</h2>
              <p className="text-muted-foreground">Could not find purchase order with ID: {id}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default PurchaseOrderDetail;
