import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { usePurchaseOrdersView } from '@/hooks/purchase-orders/usePurchaseOrdersView';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { PurchaseOrderHeader } from './PurchaseOrderHeader';
import { PurchaseOrderInfo } from './PurchaseOrderInfo';
import { ProductsTable } from './ProductsTable';
import { PaymentsTable } from './PaymentsTable';
import { DeleteConfirmDialog } from '../../invoices/detail/DeleteConfirmDialog';
import { AddPaymentDialog } from './AddPaymentDialog';

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
      
      const updatedPO = {
        ...purchaseOrder,
        lineItems: purchaseOrder.lineItems.filter(item => item.id !== productId)
      };
      
      setPurchaseOrder(updatedPO);
      
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
      
      const updatedPO = {
        ...purchaseOrder,
        vendorPayments: purchaseOrder.vendorPayments.filter(payment => payment.id !== paymentId)
      };
      
      setPurchaseOrder(updatedPO);
      
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
    return (
      <div className="container py-6 max-w-5xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-[400px] mb-6" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }
  
  if (!purchaseOrder) {
    return (
      <div className="container py-6 max-w-5xl text-center">
        <h2 className="text-2xl font-bold mb-4">Purchase Order Not Found</h2>
        <p className="text-muted-foreground mb-6">The purchase order you're looking for doesn't exist or has been deleted.</p>
        <button 
          onClick={handleBack}
          className="text-primary hover:underline"
        >
          Return to Purchase Order List
        </button>
      </div>
    );
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
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Vendor Details</h3>
          <p className="font-medium">{purchaseOrder.vendorName}</p>
          {purchaseOrder.vendor && (
            <>
              {/* Add vendor details if available */}
            </>
          )}
        </Card>
        
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
