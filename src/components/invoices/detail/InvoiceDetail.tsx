
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, 
  Download, 
  FileText, 
  Pencil, 
  Plus, 
  Printer, 
  Share2, 
  Trash2, 
  User, 
  Calendar, 
  Clock, 
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

import { InvoiceHeader } from './InvoiceHeader';
import { LineItemsTable } from './LineItemsTable';
import { PaymentsTable } from './PaymentsTable';
import { AddPaymentDialog } from './AddPaymentDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useInvoices } from '@/hooks/invoices/useInvoices';
import { formatCurrency } from '@/utils/format-utils';
import { StatusBadge } from '../shared/StatusBadge';
import { InvoiceWithDetails } from '@/types/invoice';
import { AmountDisplay } from '../shared/AmountDisplay';

export const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  const { getInvoice, deleteInvoice } = useInvoices();
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  React.useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await getInvoice(id);
        setInvoice(data);
      } catch (error) {
        console.error('Error fetching invoice:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoice();
  }, [id, getInvoice]);
  
  const handleDeleteInvoice = async () => {
    try {
      await deleteInvoice.mutateAsync(invoice?.id || '');
      setIsDeleteDialogOpen(false);
      navigate('/invoices');
      toast({
        title: "Invoice deleted",
        description: "The invoice has been permanently deleted.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleEdit = () => {
    navigate(`/invoices/${id}/edit`);
  };
  
  const handleBack = () => {
    navigate('/invoices');
  };
  
  const handleDownloadPdf = () => {
    toast({
      title: "Feature not implemented",
      description: "PDF download functionality is not yet available.",
      variant: "default"
    });
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleShare = () => {
    toast({
      title: "Feature not implemented",
      description: "Sharing functionality is not yet available.",
      variant: "default"
    });
  };
  
  const handleMarkAsPaid = (amount: number) => {
    setIsAddPaymentOpen(true);
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-6xl py-6 space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="container max-w-6xl py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <FileText className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Invoice Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">The requested invoice could not be found. It may have been deleted or you may not have permission to view it.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/invoices')}>Back to Invoices</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const dueStatus = () => {
    if (invoice.status === 'paid' || invoice.status === 'partial') return null;
    if (!invoice.dueDate) return null;
    
    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    
    if (dueDate < now) {
      const days = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <div className="text-destructive text-sm font-medium">
          Overdue by {days} {days === 1 ? 'day' : 'days'}
        </div>
      );
    }
    
    if (dueDate > now) {
      const days = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <div className="text-muted-foreground text-sm">
          Due in {days} {days === 1 ? 'day' : 'days'}
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="container max-w-6xl py-6 space-y-8 print:py-0 print:space-y-6">
      <InvoiceHeader 
        invoice={invoice}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={() => setIsDeleteDialogOpen(true)}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">{invoice.customerName}</h3>
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm"
                onClick={() => navigate(`/accounts/${invoice.customerId}`)}
              >
                View Customer
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
            {dueStatus()}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total:</span>
              <AmountDisplay 
                amount={invoice.total} 
                className="text-base font-medium"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Paid:</span>
              <AmountDisplay 
                amount={invoice.amountPaid} 
                variant="success" 
                className="text-base font-medium"
              />
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Balance:</span>
              <AmountDisplay 
                amount={invoice.balance} 
                variant={invoice.balance > 0 ? "warning" : "success"}
                className="text-lg font-semibold"
              />
            </div>
            
            {invoice.status !== 'paid' && invoice.balance > 0 && (
              <Button 
                className="w-full mt-2" 
                onClick={() => setIsAddPaymentOpen(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="payments">
            Payments
            {invoice.payments.length > 0 && (
              <span className="ml-2 bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                {invoice.payments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Products and services included in this invoice</CardDescription>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/invoices/${invoice.id}/add-item`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <LineItemsTable 
                lineItems={invoice.lineItems} 
                invoiceId={invoice.id} 
              />
            </CardContent>
            {invoice.notes && (
              <>
                <Separator />
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
                </CardContent>
              </>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Payment history for this invoice</CardDescription>
              <div className="flex justify-end">
                <Button onClick={() => setIsAddPaymentOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PaymentsTable 
                payments={invoice.payments} 
                invoiceId={invoice.id}
              />
            </CardContent>
            <CardFooter className="bg-muted/50 flex justify-between">
              <div>
                <span className="text-muted-foreground">Balance Due:</span>
              </div>
              <AmountDisplay 
                amount={invoice.balance} 
                variant={invoice.balance > 0 ? "warning" : "success"}
                className="text-lg font-semibold"
              />
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="print:hidden">
        <Separator className="my-6" />
        
        <div className="flex flex-wrap gap-3 justify-between">
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPdf}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEdit}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Invoice
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Invoice
            </Button>
          </div>
        </div>
      </div>
      
      <AddPaymentDialog
        invoice={invoice}
        open={isAddPaymentOpen}
        onOpenChange={setIsAddPaymentOpen}
      />
      
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteInvoice}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice #${invoice.invoiceNumber}? This action cannot be undone and will remove all associated line items and payments.`}
      />
    </div>
  );
};
