
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Pencil, 
  Trash2, 
  Download, 
  Mail,
  MoreHorizontal, 
  Copy, 
  ArrowLeft
} from 'lucide-react';
import { useInvoicesView } from '@/hooks/invoices/useInvoicesView';
import { InvoiceWithDetails } from '@/types/invoice';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/invoices/shared/StatusBadge';
import { LineItemsTable } from './LineItemsTable';
import { PaymentsTable } from './PaymentsTable';
import { AddPaymentDialog } from './AddPaymentDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleteLineItemDialogOpen, setIsDeleteLineItemDialogOpen] = useState(false);
  const [isDeletePaymentDialogOpen, setIsDeletePaymentDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const { getInvoice, deleteInvoice, deleteLineItem, deletePayment } = useInvoicesView();
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const invoiceData = await getInvoice(id);
        if (invoiceData) {
          setInvoice(invoiceData);
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

    fetchInvoice();
  }, [id, getInvoice, toast]);

  const handleBackClick = () => {
    navigate('/invoices');
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteInvoice.mutateAsync(id);
      toast({
        title: 'Invoice Deleted',
        description: 'The invoice has been successfully deleted.',
      });
      navigate('/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the invoice.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLineItem = async () => {
    if (!selectedItemId) return;
    
    try {
      await deleteLineItem.mutateAsync({ id: selectedItemId });
      // Refresh invoice data
      if (id) {
        const updatedInvoice = await getInvoice(id);
        if (updatedInvoice) {
          setInvoice(updatedInvoice);
        }
      }
      setIsDeleteLineItemDialogOpen(false);
    } catch (error) {
      console.error('Error deleting line item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the line item.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedItemId) return;
    
    try {
      await deletePayment.mutateAsync({ id: selectedItemId });
      // Refresh invoice data
      if (id) {
        const updatedInvoice = await getInvoice(id);
        if (updatedInvoice) {
          setInvoice(updatedInvoice);
        }
      }
      setIsDeletePaymentDialogOpen(false);
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the payment.',
        variant: 'destructive',
      });
    }
  };

  const handleAddPaymentSuccess = async () => {
    if (!id) return;
    
    try {
      // Refresh invoice data after adding payment
      const updatedInvoice = await getInvoice(id);
      if (updatedInvoice) {
        setInvoice(updatedInvoice);
      }
    } catch (error) {
      console.error('Error refreshing invoice:', error);
    }
  };

  const confirmDeleteLineItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsDeleteLineItemDialogOpen(true);
  };

  const confirmDeletePayment = (paymentId: string) => {
    setSelectedItemId(paymentId);
    setIsDeletePaymentDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container py-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container py-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Invoice Not Found</h1>
        </div>
        <div className="bg-muted/40 rounded-lg p-8 text-center">
          <h2 className="text-xl font-medium mb-2">Invoice could not be found</h2>
          <p className="text-muted-foreground mb-4">
            The invoice you're looking for may have been deleted or doesn't exist.
          </p>
          <Button onClick={handleBackClick}>Return to Invoices</Button>
        </div>
      </div>
    );
  }

  const isEditable = invoice.status !== 'paid';

  return (
    <div className="container py-6 max-w-4xl">
      {/* Header with navigation and actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Invoice {invoice?.invoiceNumber}</h1>
          <StatusBadge status={invoice?.status || "draft"} />
        </div>

        <div className="flex items-center gap-2">
          {isEditable && (
            <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => setIsAddPaymentOpen(true)}
            disabled={!isEditable}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => toast({ title: "Coming soon", description: "Download PDF feature is coming soon." })}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toast({ title: "Coming soon", description: "Email invoice feature is coming soon." })}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Invoice
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast({ title: "Coming soon", description: "Duplicate invoice feature is coming soon." })}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {isEditable && (
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setIsDeleteAlertOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Invoice details */}
      {invoice && (
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer</h3>
                  <p className="font-medium">{invoice.customerName}</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Invoice Date</h3>
                    <p>{invoice.invoiceDate.toLocaleDateString()}</p>
                  </div>
                  
                  {invoice.dueDate && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h3>
                      <p>{invoice.dueDate.toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Amount</h3>
                    <p className="font-medium">${invoice.total.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Balance</h3>
                    <p className="font-medium">${invoice.balance.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line items table */}
          <Card className="overflow-hidden">
            <LineItemsTable 
              lineItems={invoice.lineItems} 
              invoiceId={invoice.id}
              invoiceGlideRowId={invoice.invoiceNumber}
              status={invoice.status}
              onDeleteItem={confirmDeleteLineItem}
            />
          </Card>

          {/* Payments table */}
          <Card className="overflow-hidden">
            <PaymentsTable 
              payments={invoice.payments} 
              invoiceId={invoice.id}
              invoiceGlideRowId={invoice.invoiceNumber}
              customerId={invoice.customerId}
              invoiceTotal={invoice.total}
              invoiceBalance={invoice.balance}
              status={invoice.status}
              onDeletePayment={confirmDeletePayment}
            />
          </Card>

          {/* Invoice notes if any */}
          {invoice.notes && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Delete Invoice Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this invoice and all associated data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Line Item Confirmation Dialog */}
      <DeleteConfirmDialog
        title="Delete Line Item"
        description="Are you sure you want to delete this line item? This action cannot be undone."
        open={isDeleteLineItemDialogOpen}
        onOpenChange={setIsDeleteLineItemDialogOpen}
        onConfirm={handleDeleteLineItem}
      />

      {/* Delete Payment Confirmation Dialog */}
      <DeleteConfirmDialog
        title="Delete Payment"
        description="Are you sure you want to delete this payment record? This will update the invoice balance. This action cannot be undone."
        open={isDeletePaymentDialogOpen}
        onOpenChange={setIsDeletePaymentDialogOpen}
        onConfirm={handleDeletePayment}
      />

      {/* Add Payment Dialog */}
      {invoice && (
        <AddPaymentDialog
          invoiceId={invoice.id}
          invoiceGlideRowId={invoice.invoiceNumber}
          customerId={invoice.customerId}
          invoiceTotal={invoice.total}
          invoiceBalance={invoice.balance}
          open={isAddPaymentOpen}
          onOpenChange={setIsAddPaymentOpen}
          onSuccess={handleAddPaymentSuccess}
        />
      )}
    </div>
  );
}
