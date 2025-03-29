import { useParams } from 'react-router-dom';
import { usePurchaseOrderDetail } from '@/hooks/usePurchaseOrderDetail';
import PurchaseOrderDetailView from '@/components/new/purchase-orders/purchase-order-detail-view';
import { useToast } from '@/hooks/use-toast';

const PurchaseOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { purchaseOrder, isLoading, error, fetchPurchaseOrderDetail } = usePurchaseOrderDetail(id || '');

  const handleRefresh = () => {
    fetchPurchaseOrderDetail(id || '');
    toast({
      title: 'Refreshed',
      description: 'Purchase order data has been refreshed.',
    });
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          <p>Error loading purchase order: {error}</p>
        </div>
      </div>
    );
  }

  if (!purchaseOrder && !isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-muted p-4 rounded-md text-muted-foreground">
          <p>Purchase order not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {purchaseOrder && (
        <PurchaseOrderDetailView
          purchaseOrder={purchaseOrder}
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default PurchaseOrderDetail;
