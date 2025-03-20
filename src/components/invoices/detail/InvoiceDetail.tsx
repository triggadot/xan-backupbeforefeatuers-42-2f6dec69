
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  CreditCard, 
  Pencil, 
  Trash2, 
  CheckCircle, 
  Plus, 
  Receipt, 
  Printer, 
  Download 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useInvoices } from '@/hooks/invoices/useInvoices';
import { InvoiceWithDetails } from '@/types/invoice';
import { LineItemsTable } from './LineItemsTable';
import { PaymentsTable } from './PaymentsTable';
import { InvoiceHeader } from './InvoiceHeader';
import { AddPaymentDialog } from './AddPaymentDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { formatDate } from '@/utils/format-utils';
import { Skeleton } from '@/components/ui/skeleton';

export const InvoiceDetailView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { getInvoice, deleteInvoice } = useInvoices();

  // Fetch invoice data
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getInvoice(id);
        setInvoice(data);
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

    fetchData();
  }, [id, getInvoice, toast]);

  // Handle invoice deletion
  const handleDelete = async () => {
    if (!invoice) return;
    
    try {
      const success = await deleteInvoice(invoice.id);
      if (success) {
        toast({
          title: 'Success',
          description: 'Invoice deleted successfully.',
        });
        navigate('/invoices');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invoice.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Rendering skeletons while loading
  if (isLoading) {
    return (
      <div className="container max-w-6xl py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
        
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Show error if invoice not found
  if (!invoice && !isLoading) {
    return (
      <div className="container max-w-6xl py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Invoice Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              The requested invoice could not be found. It may have been deleted or you may not have permission to view it.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/invoices')}>Back to Invoices</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      {/* Header with controls */}
      <InvoiceHeader 
        invoice={invoice} 
        onBack={() => navigate(-1)}
        onEdit={() => navigate(`/invoices/${invoice.id}/edit`)}
        onDelete={() => setIsDeleteDialogOpen(true)}
      />

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="font-medium">{invoice.customerName}</div>
              <Button 
                variant="link" 
                className="h-auto p-0 text-blue-600"
                onClick={() => navigate(`/accounts/${invoice.customerId}`)}
              >
                View Customer Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dates Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Date:</span>
              <span>{formatDate(invoice.invoiceDate)}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Amount Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">${invoice.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid:</span>
              <span className="font-medium text-green-600">${invoice.amountPaid.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-bold">${invoice.balance.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for line items and payments */}
      <Tabs defaultValue="line-items" className="w-full">
        <TabsList>
          <TabsTrigger value="line-items" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Line Items
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="line-items" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Line Items</CardTitle>
              <CardDescription>Products and services included in this invoice</CardDescription>
            </CardHeader>
            <CardContent>
              <LineItemsTable 
                lineItems={invoice.lineItems} 
                invoiceId={invoice.id}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate(`/invoices/${invoice.id}/add-item`)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
              <div className="flex flex-col items-end space-y-2">
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.taxAmount && invoice.taxAmount > 0 && (
                  <div className="flex justify-between gap-8">
                    <span className="text-muted-foreground">Tax ({invoice.taxRate?.toFixed(2)}%):</span>
                    <span>${invoice.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-8 font-bold">
                  <span>Total:</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Payment History</span>
                {invoice.status !== 'paid' && (
                  <Button onClick={() => setIsPaymentDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                )}
              </CardTitle>
              <CardDescription>Payments made against this invoice</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentsTable 
                payments={invoice.payments} 
                invoiceId={invoice.id}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Total:</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="text-green-600">${invoice.amountPaid.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Balance Due:</span>
                  <span>${invoice.balance.toFixed(2)}</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notes section if present */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-end">
        <Button variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        {invoice.status !== 'paid' && (
          <Button size="sm" onClick={() => setIsPaymentDialogOpen(true)}>
            <CreditCard className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        )}
        {invoice.balance === 0 && invoice.status !== 'paid' && (
          <Button variant="success" size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Paid
          </Button>
        )}
      </div>

      {/* Dialogs */}
      <AddPaymentDialog 
        invoice={invoice}
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone and will remove all associated line items and payments."
      />
    </div>
  );
};
