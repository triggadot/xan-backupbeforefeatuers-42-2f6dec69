
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvoicesView } from '@/hooks/invoices/useInvoicesView';
import { formatCurrency } from '@/utils/format-utils';
import { InvoiceListItem } from '@/types/invoiceView';
import { StatusBadge } from '@/components/invoices/shared/StatusBadge';
import { InvoiceFilterBar } from '@/components/invoices/list/InvoiceFilters';
import { InvoiceFilters } from '@/types/invoice';

export default function Invoices() {
  const navigate = useNavigate();
  const { fetchInvoices, isLoading } = useInvoicesView();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<InvoiceFilters>({});
  
  useEffect(() => {
    loadInvoices();
  }, []);
  
  const loadInvoices = async () => {
    try {
      const data = await fetchInvoices(filters);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };
  
  const handleFilterChange = (newFilters: InvoiceFilters) => {
    setFilters(newFilters);
    // Automatically reload on filter change
    const fetchData = async () => {
      const data = await fetchInvoices(newFilters);
      setInvoices(data);
    };
    fetchData();
  };
  
  const handleCreateInvoice = () => {
    navigate('/invoices/new');
  };
  
  const handleInvoiceClick = (invoice: InvoiceListItem) => {
    navigate(`/invoices/${invoice.id}`);
  };
  
  const filteredInvoices = invoices.filter(invoice => {
    if (activeTab === 'all') return true;
    if (activeTab === 'draft') return invoice.status === 'draft';
    if (activeTab === 'sent') return invoice.status === 'sent';
    if (activeTab === 'paid') return invoice.status === 'paid';
    if (activeTab === 'overdue') return invoice.status === 'overdue';
    if (activeTab === 'partial') return invoice.status === 'partial';
    return true;
  });

  if (isLoading && invoices.length === 0) {
    return (
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
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
      
      <div className="mb-6">
        <InvoiceFilterBar 
          filters={filters}
          onFiltersChange={handleFilterChange}
        />
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
          <TabsTrigger value="partial">Partial</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {filteredInvoices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvoices.map((invoice) => (
                <Card 
                  key={invoice.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleInvoiceClick(invoice)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 truncate">Invoice #{invoice.invoiceNumber}</h3>
                        
                        <div className="text-sm text-muted-foreground mb-2 truncate">
                          {invoice.customerName}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {new Date(invoice.date).toLocaleDateString()}
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <StatusBadge status={invoice.status} />
                          
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(invoice.total)}
                            </div>
                            {invoice.amountPaid > 0 && invoice.amountPaid < invoice.total && (
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(invoice.amountPaid)} paid
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <h3 className="font-medium text-lg mb-2">No invoices found</h3>
                <p className="text-muted-foreground mb-4">Create your first invoice to get started.</p>
                <Button onClick={handleCreateInvoice}>
                  <Plus className="mr-2 h-4 w-4" /> Create Invoice
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
