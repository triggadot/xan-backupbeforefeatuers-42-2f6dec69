
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { usePurchaseOrdersView } from '@/hooks/purchase-orders/usePurchaseOrdersView';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { PurchaseOrderHeader } from './PurchaseOrderHeader';
import { PurchaseOrderInfo } from './PurchaseOrderInfo';
import { ProductsTable } from './ProductsTable';
import { PaymentsTable } from './PaymentsTable';
import { DeleteConfirmDialog } from '../../invoices/detail/DeleteConfirmDialog';
import { AddPaymentDialog } from './AddPaymentDialog';
import { PurchaseOrderDetailSkeleton } from './PurchaseOrderDetailSkeleton';
import { NotFoundView } from './NotFoundView';
import { VendorDetailsCard } from './VendorDetailsCard';

export function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getPurchaseOrder, deleteProduct, deletePayment } = usePurchaseOrdersView();
  
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  
  useEffect(() => {
    fetchPurchaseOrder();
  }, [id]);
  
  const fetchPurchaseOrder = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const data = await getPurchaseOrder(id);
      if (data) {
        setPurchaseOrder(data);
      }
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchase order details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    navigate('/purchase-orders');
  };
  
  const handleEdit = () => {
    navigate(`/purchase-orders/${id}/edit`);
  };
  
  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    setIsDeleteDialogOpen(false);
    toast({
      title: 'Success',
      description: 'Purchase Order deleted successfully.',
    });
    navigate('/purchase-orders');
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if (!purchaseOrder) return;
    
    try {
      await deleteProduct.mutateAsync({ id: productId });
      
      toast({
        title: 'Success',
        description: 'Product deleted successfully.',
      });
      
      fetchPurchaseOrder();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeletePayment = async (paymentId: string) => {
    if (!purchaseOrder) return;
    
    try {
      await deletePayment.mutateAsync({ id: paymentId });
      
      toast({
        title: 'Success',
        description: 'Payment deleted successfully.',
      });
      
      fetchPurchaseOrder();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete payment.',
        variant: 'destructive',
      });
    }
  };
  
  const handleAddPayment = () => {
    setIsAddPaymentOpen(true);
  };
  
  if (isLoading) {
    return <PurchaseOrderDetailSkeleton />;
  }
  
  if (!purchaseOrder) {
    return <NotFoundView onBack={handleBack} />;
  }
  
  return (
    <div className="container py-6 max-w-5xl">
      <PurchaseOrderHeader 
        purchaseOrder={purchaseOrder}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        <VendorDetailsCard purchaseOrder={purchaseOrder} />
        
        <PurchaseOrderInfo 
          purchaseOrder={purchaseOrder}
          onAddPayment={handleAddPayment}
        />
      </div>
      
      <div className="my-6 border rounded-md bg-card overflow-hidden">
        <ProductsTable 
          products={purchaseOrder.lineItems}
          purchaseOrderId={purchaseOrder.id}
          purchaseOrderGlideRowId={purchaseOrder.glide_row_id}
          status={purchaseOrder.status}
          onDeleteProduct={handleDeleteProduct}
        />
      </div>
      
      <div className="my-6 border rounded-md bg-card overflow-hidden">
        <PaymentsTable 
          payments={purchaseOrder.vendorPayments}
          purchaseOrderId={purchaseOrder.id}
          purchaseOrderGlideRowId={purchaseOrder.glide_row_id}
          vendorId={purchaseOrder.vendorId || ''}
          purchaseOrderTotal={purchaseOrder.total_amount}
          purchaseOrderBalance={purchaseOrder.balance || 0}
          status={purchaseOrder.status}
          onDeletePayment={handleDeletePayment}
        />
      </div>
      
      <DeleteConfirmDialog
        title="Delete Purchase Order"
        description="Are you sure you want to delete this purchase order? This action cannot be undone."
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
      
      <AddPaymentDialog 
        purchaseOrderId={purchaseOrder.id}
        purchaseOrderGlideRowId={purchaseOrder.glide_row_id}
        vendorId={purchaseOrder.vendorId || ''}
        purchaseOrderTotal={purchaseOrder.total_amount}
        purchaseOrderBalance={purchaseOrder.balance || 0}
        open={isAddPaymentOpen}
        onOpenChange={setIsAddPaymentOpen}
        onSuccess={fetchPurchaseOrder}
      />
    </div>
  );
}

export default PurchaseOrderDetail;
