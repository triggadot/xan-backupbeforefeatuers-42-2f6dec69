
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvoicesView } from '@/hooks/invoices/useInvoicesView';
import { InvoiceTable } from '@/components/invoices/list/InvoiceTable';
import { InvoiceListItem } from '@/types/invoiceView';
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

export default function Invoices() {
  const navigate = useNavigate();
  const { fetchInvoices, deleteInvoice, isLoading } = useInvoicesView();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceListItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    loadInvoices();
  }, []);
  
  const loadInvoices = async () => {
    const data = await fetchInvoices();
    setInvoices(data);
  };
  
  const handleCreateInvoice = () => {
    navigate('/invoices/new');
  };
  
  const handleEditInvoice = (invoice: InvoiceListItem) => {
    navigate(`/invoices/${invoice.id}/edit`);
  };
  
  const handleDeleteInvoice = async () => {
    if (selectedInvoice) {
      try {
        await deleteInvoice.mutateAsync(selectedInvoice.id);
        setShowDeleteDialog(false);
        setSelectedInvoice(null);
        loadInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };
  
  const confirmDelete = (invoice: InvoiceListItem) => {
    setSelectedInvoice(invoice);
    setShowDeleteDialog(true);
  };
  
  const filteredInvoices = invoices.filter(invoice => {
    if (activeTab === 'all') return true;
    if (activeTab === 'draft') return invoice.status === 'draft';
    if (activeTab === 'sent') return invoice.status === 'sent';
    if (activeTab === 'paid') return invoice.status === 'paid';
    if (activeTab === 'overdue') return invoice.status === 'overdue';
    return true;
  });

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <Button onClick={handleCreateInvoice}>
          <Plus className="mr-2 h-4 w-4" /> New Invoice
        </Button>
      </div>
      
      <Tabs 
        defaultValue="all" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <InvoiceTable
            data={filteredInvoices}
            onEdit={handleEditInvoice}
            onDelete={confirmDelete}
            onCreateInvoice={handleCreateInvoice}
          />
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the invoice 
              {selectedInvoice && ` "${selectedInvoice.invoiceNumber}"`} 
              and all of its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
