
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useInvoicesView } from '@/hooks/invoices/useInvoicesView';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/invoices/shared/StatusBadge';
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
import { formatCurrency } from '@/utils/format-utils';
import { useToast } from '@/hooks/use-toast';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoice, deleteInvoice, isLoading } = useInvoicesView();
  const [invoice, setInvoice] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    
    const fetchInvoice = async () => {
      const data = await getInvoice(id);
      if (data) {
        setInvoice(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load invoice details',
          variant: 'destructive',
        });
      }
    };
    
    fetchInvoice();
  }, [id, getInvoice, toast]);

  const handleBackClick = () => {
    navigate('/invoices');
  };

  const handleEditClick = () => {
    navigate(`/invoices/${id}/edit`);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteInvoice.mutateAsync(id);
      navigate('/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
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
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              The invoice you are looking for could not be found or has been deleted.
            </p>
            <Button onClick={handleBackClick}>Return to Invoices</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEditClick}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer</h3>
                <p className="font-medium">{invoice.customerName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Date</h3>
                <p>{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Amount</h3>
                <p className="font-medium">{formatCurrency(invoice.total)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Balance</h3>
                <p className="font-medium">{formatCurrency(invoice.balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Line Items</h3>
            {invoice.lineItems.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Description</th>
                      <th className="text-right p-3">Quantity</th>
                      <th className="text-right p-3">Price</th>
                      <th className="text-right p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((item: any) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">{item.description}</td>
                        <td className="p-3 text-right">{item.quantity}</td>
                        <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr className="border-t">
                      <td colSpan={3} className="p-3 text-right font-medium">Total:</td>
                      <td className="p-3 text-right font-bold">{formatCurrency(invoice.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No line items found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Payments</h3>
            {invoice.payments.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Method</th>
                      <th className="text-left p-3">Notes</th>
                      <th className="text-right p-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((payment: any) => (
                      <tr key={payment.id} className="border-t">
                        <td className="p-3">{new Date(payment.date).toLocaleDateString()}</td>
                        <td className="p-3">{payment.paymentMethod}</td>
                        <td className="p-3">{payment.notes || '-'}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(payment.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr className="border-t">
                      <td colSpan={3} className="p-3 text-right font-medium">Total Paid:</td>
                      <td className="p-3 text-right font-bold">{formatCurrency(invoice.amountPaid)}</td>
                    </tr>
                    <tr className="border-t">
                      <td colSpan={3} className="p-3 text-right font-medium">Balance:</td>
                      <td className="p-3 text-right font-bold">{formatCurrency(invoice.balance)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No payments recorded</p>
            )}
          </CardContent>
        </Card>

        {invoice.notes && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-2">Notes</h3>
              <p className="text-muted-foreground">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InvoiceDetail;
