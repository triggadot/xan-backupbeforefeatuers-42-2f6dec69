
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useInvoicesView } from '@/hooks/invoices/useInvoicesView';
import { InvoiceWithDetails } from '@/types/invoice';
import { InvoiceHeader } from './InvoiceHeader';
import { InvoiceInfo } from './InvoiceInfo';
import { LineItemsTable } from './LineItemsTable';
import { PaymentsTable } from './PaymentsTable';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { AddPaymentDialog } from './AddPaymentDialog';

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getInvoice, deleteLineItem, deletePayment } = useInvoicesView();
  
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  
  useEffect(() => {
    fetchInvoice();
  }, [id]);
  
  const fetchInvoice = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const data = await getInvoice(id);
      if (data) {
        setInvoice(data);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoice details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    navigate('/invoices');
  };
  
  const handleEdit = () => {
    navigate(`/invoices/${id}/edit`);
  };
  
  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    // TODO: Implement delete invoice functionality
    setIsDeleteDialogOpen(false);
    toast({
      title: 'Success',
      description: 'Invoice deleted successfully.',
    });
    navigate('/invoices');
  };
  
  const handleDeleteLineItem = async (itemId: string) => {
    if (!invoice) return;
    
    try {
      await deleteLineItem.mutateAsync({ id: itemId });
      
      toast({
        title: 'Success',
        description: 'Line item deleted successfully.',
      });
      
      // Update the UI by removing the deleted item
      const updatedInvoice = {
        ...invoice,
        lineItems: invoice.lineItems.filter(item => item.id !== itemId)
      };
      
      setInvoice(updatedInvoice);
      
      // Refresh data to get updated totals
      fetchInvoice();
    } catch (error) {
      console.error('Error deleting line item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete line item.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeletePayment = async (paymentId: string) => {
    if (!invoice) return;
    
    try {
      await deletePayment.mutateAsync({ id: paymentId });
      
      toast({
        title: 'Success',
        description: 'Payment deleted successfully.',
      });
      
      // Update the UI by removing the deleted payment
      const updatedInvoice = {
        ...invoice,
        payments: invoice.payments.filter(payment => payment.id !== paymentId)
      };
      
      setInvoice(updatedInvoice);
      
      // Refresh data to get updated totals
      fetchInvoice();
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
  
  if (!invoice) {
    return (
      <div className="container py-6 max-w-5xl text-center">
        <h2 className="text-2xl font-bold mb-4">Invoice Not Found</h2>
        <p className="text-muted-foreground mb-6">The invoice you're looking for doesn't exist or has been deleted.</p>
        <button 
          onClick={handleBack}
          className="text-primary hover:underline"
        >
          Return to Invoice List
        </button>
      </div>
    );
  }
  
  return (
    <div className="container py-6 max-w-5xl">
      <InvoiceHeader 
        invoice={invoice}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Customer Details</h3>
          <p className="font-medium">{invoice.customerName}</p>
          {invoice.account && (
            <>
              {/* Add customer details if available */}
            </>
          )}
        </Card>
        
        <InvoiceInfo 
          invoice={invoice}
          onAddPayment={handleAddPayment}
        />
      </div>
      
      <div className="my-6 border rounded-md bg-card overflow-hidden">
        <LineItemsTable 
          lineItems={invoice.lineItems}
          invoiceId={invoice.id}
          invoiceGlideRowId={invoice.glide_row_id}
          status={invoice.status}
          onDeleteItem={handleDeleteLineItem}
        />
      </div>
      
      <div className="my-6 border rounded-md bg-card overflow-hidden">
        <PaymentsTable 
          payments={invoice.payments}
          invoiceId={invoice.id}
          invoiceGlideRowId={invoice.glide_row_id}
          customerId={invoice.customerId}
          invoiceTotal={invoice.total_amount}
          invoiceBalance={invoice.balance}
          status={invoice.status}
          onDeletePayment={handleDeletePayment}
        />
      </div>
      
      <DeleteConfirmDialog
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
      
      <AddPaymentDialog 
        invoiceId={invoice.id}
        invoiceGlideRowId={invoice.glide_row_id}
        customerId={invoice.customerId}
        invoiceTotal={invoice.total_amount}
        invoiceBalance={invoice.balance}
        open={isAddPaymentOpen}
        onOpenChange={setIsAddPaymentOpen}
        onSuccess={fetchInvoice}
      />
    </div>
  );
}

export default InvoiceDetail;
