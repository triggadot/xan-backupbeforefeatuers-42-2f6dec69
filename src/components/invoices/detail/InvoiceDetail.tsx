
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Pencil, 
  Trash2, 
  Download, 
  PlusCircle, 
  FilePlus, 
  Mail,
  MoreHorizontal, 
  Copy, 
  ArrowLeft
} from 'lucide-react';
import { useInvoicesNew } from '@/hooks/invoices/useInvoicesNew';
import { InvoiceWithDetails } from '@/types/invoiceView';

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
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/invoices/shared/StatusBadge';
import { InvoiceHeader } from './InvoiceHeader';
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
  const { getInvoice, deleteInvoice, deleteLineItem, deletePayment } = useInvoicesNew();
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const invoiceData = await getInvoice(id);
        if (invoiceData) {
          // Make sure we convert to the correct type with all required fields
          const fullInvoiceData: InvoiceWithDetails = {
            ...invoiceData,
            invoiceDate: invoiceData.date, // Ensure we have invoiceDate
            subtotal: invoiceData.total, // Use total as subtotal if not provided
            amountPaid: invoiceData.totalPaid, // Use totalPaid as amountPaid
            status: (invoiceData.status as "draft" | "paid" | "partial" | "sent" | "overdue") || "draft"
          };
          setInvoice(fullInvoiceData);
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
    if (!selectedItemId || !invoice?.id) return;
    
    try {
      await deleteLineItem.mutateAsync({ id: selectedItemId, invoiceId: invoice.id });
      // Refresh invoice data
      const updatedInvoice = await getInvoice(invoice.id);
      if (updatedInvoice) {
        const fullInvoiceData: InvoiceWithDetails = {
          ...updatedInvoice,
          invoiceDate: updatedInvoice.date,
          subtotal: updatedInvoice.total,
          amountPaid: updatedInvoice.totalPaid,
          status: (updatedInvoice.status as "draft" | "paid" | "partial" | "sent" | "overdue") || "draft"
        };
        setInvoice(fullInvoiceData);
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
    if (!selectedItemId || !invoice?.id) return;
    
    try {
      await deletePayment.mutateAsync({ id: selectedItemId, invoiceId: invoice.id });
      // Refresh invoice data
      const updatedInvoice = await getInvoice(invoice.id);
      if (updatedInvoice) {
        const fullInvoiceData: InvoiceWithDetails = {
          ...updatedInvoice,
          invoiceDate: updatedInvoice.date,
          subtotal: updatedInvoice.total,
          amountPaid: updatedInvoice.totalPaid,
          status: (updatedInvoice.status as "draft" | "paid" | "partial" | "sent" | "overdue") || "draft"
        };
        setInvoice(fullInvoiceData);
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
    if (!invoice?.id) return;
    
    try {
      // Refresh invoice data after adding payment
      const updatedInvoice = await getInvoice(invoice.id);
      if (updatedInvoice) {
        const fullInvoiceData: InvoiceWithDetails = {
          ...updatedInvoice,
          invoiceDate: updatedInvoice.date,
          subtotal: updatedInvoice.total,
          amountPaid: updatedInvoice.totalPaid,
          status: (updatedInvoice.status as "draft" | "paid" | "partial" | "sent" | "overdue") || "draft"
        };
        setInvoice(fullInvoiceData);
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
          <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setIsAddPaymentOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
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
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => setIsDeleteAlertOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Invoice details */}
      {invoice && (
        <div className="grid gap-6">
          {/* Invoice header with customer and financial info */}
          <InvoiceHeader invoice={invoice} />

          {/* Line items table */}
          <div className="rounded-md border">
            <LineItemsTable 
              lineItems={invoice.lineItems} 
              onDeleteItem={confirmDeleteLineItem}
            />
          </div>

          {/* Payments table */}
          <div className="rounded-md border">
            <PaymentsTable 
              payments={invoice.payments} 
              onDeletePayment={confirmDeletePayment}
            />
          </div>

          {/* Invoice notes if any */}
          {invoice.notes && (
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
            </div>
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
          customerId={invoice.customerId}
          open={isAddPaymentOpen}
          onOpenChange={setIsAddPaymentOpen}
          onSuccess={handleAddPaymentSuccess}
        />
      )}
    </div>
  );
}
