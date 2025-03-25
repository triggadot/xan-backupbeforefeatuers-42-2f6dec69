
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { usePurchaseOrdersView } from '@/hooks/purchase-orders/usePurchaseOrdersView';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { EntityDetailLayout } from '@/components/common/EntityDetailLayout';
import { PurchaseOrderDetailSkeleton } from './PurchaseOrderDetailSkeleton';
import { NotFoundView } from './NotFoundView';
import { PurchaseOrderHeader } from './PurchaseOrderHeader';
import { PurchaseOrderInfo } from './PurchaseOrderInfo';
import { VendorDetailsCard } from './VendorDetailsCard';
import { ProductsTable } from './ProductsTable';
import { PaymentsTable } from './PaymentsTable';
import { formatCurrency } from '@/utils/format-utils';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaymentForm } from './PaymentForm';

export function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPurchaseOrder, updatePurchaseOrder, isLoading } = usePurchaseOrders();
  const { deleteProduct, deletePayment, addPayment, updatePayment } = usePurchaseOrdersView();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoadingPurchaseOrder, setIsLoadingPurchaseOrder] = useState(true);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadPurchaseOrder(id);
    }
  }, [id]);

  const loadPurchaseOrder = async (purchaseOrderId: string) => {
    setIsLoadingPurchaseOrder(true);
    try {
      const data = await getPurchaseOrder(purchaseOrderId);
      setPurchaseOrder(data);
    } catch (error) {
      console.error('Error loading purchase order:', error);
    } finally {
      setIsLoadingPurchaseOrder(false);
    }
  };

  const handleRefresh = () => {
    if (id) {
      loadPurchaseOrder(id);
    }
  };

  const handleAddPayment = () => {
    setIsAddPaymentOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!purchaseOrder) return;
    
    try {
      await deleteProduct.mutateAsync({ id: productId });
      handleRefresh();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!purchaseOrder) return;
    
    try {
      await deletePayment.mutateAsync({ id: paymentId });
      handleRefresh();
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const handleSubmitPayment = async (data: any) => {
    if (!purchaseOrder) return;
    
    try {
      await addPayment.mutateAsync({
        purchaseOrderGlideId: purchaseOrder.glide_row_id,
        data,
        vendorId: purchaseOrder.vendorId || purchaseOrder.rowid_accounts || '',
      });
      setIsAddPaymentOpen(false);
      handleRefresh();
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  };

  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" | "warning" => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'received':
        return 'default';
      case 'partial':
        return 'warning';
      case 'complete':
        return 'success';
      default:
        return 'default';
    }
  };
  
  const goBackToList = () => {
    navigate('/purchase-orders');
  };

  if (isLoadingPurchaseOrder) {
    return <PurchaseOrderDetailSkeleton />;
  }

  if (!purchaseOrder) {
    return <NotFoundView onBack={goBackToList} />;
  }

  return (
    <EntityDetailLayout
      title={`Purchase Order ${purchaseOrder.number || `#${purchaseOrder.id.substring(0, 8)}`}`}
      status={{
        label: purchaseOrder.status,
        variant: getStatusVariant(purchaseOrder.status)
      }}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3 mr-2" />
            Refresh
          </Button>
        </>
      }
      backLink="/purchase-orders"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PurchaseOrderInfo 
          purchaseOrder={purchaseOrder} 
          onAddPayment={handleAddPayment} 
        />
        <VendorDetailsCard purchaseOrder={purchaseOrder} />
      </div>

      <div className="mt-6 border rounded-md">
        <ProductsTable 
          products={purchaseOrder.lineItems} 
          purchaseOrderId={purchaseOrder.id}
          purchaseOrderGlideRowId={purchaseOrder.glide_row_id}
          status={purchaseOrder.status}
          onDeleteProduct={handleDeleteProduct}
        />
      </div>

      <div className="mt-6 border rounded-md">
        <PaymentsTable 
          payments={purchaseOrder.vendorPayments}
          purchaseOrderId={purchaseOrder.id}
          purchaseOrderGlideRowId={purchaseOrder.glide_row_id}
          vendorId={purchaseOrder.vendorId || purchaseOrder.rowid_accounts || ''}
          purchaseOrderTotal={purchaseOrder.total_amount}
          purchaseOrderBalance={purchaseOrder.balance || 0}
          status={purchaseOrder.status}
          onDeletePayment={handleDeletePayment}
        />
      </div>
      
      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          <PaymentForm
            vendorId={purchaseOrder.vendorId || purchaseOrder.rowid_accounts || ''}
            purchaseOrderTotal={purchaseOrder.total_amount}
            purchaseOrderBalance={purchaseOrder.balance || 0}
            onSubmit={handleSubmitPayment}
            onCancel={() => setIsAddPaymentOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </EntityDetailLayout>
  );
}
