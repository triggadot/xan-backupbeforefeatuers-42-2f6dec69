
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import InvoiceList from '@/components/invoices/list/InvoiceList';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { useInvoicesView } from '@/hooks/invoices/useInvoicesView';
import { InvoiceListItem } from '@/types/invoiceView';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const { fetchInvoices, isLoading, error } = useInvoicesView();
  const navigate = useNavigate();

  useEffect(() => {
    const loadInvoices = async () => {
      const data = await fetchInvoices();
      setInvoices(data);
    };
    
    loadInvoices();
  }, [fetchInvoices]);

  const handleViewInvoice = (id: string) => {
    navigate(`/invoices/${id}`);
  };

  const handleCreateInvoice = () => {
    navigate('/invoices/new');
  };

  return (
    <>
      <Helmet>
        <title>Invoices | Glide Sync</title>
      </Helmet>
      <div className="container mx-auto py-6">
        <ScrollAnimation type="fade" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Invoices</h1>
            <Button onClick={handleCreateInvoice} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Invoice
            </Button>
          </div>
          <InvoiceList 
            invoices={invoices} 
            isLoading={isLoading} 
            error={error} 
            onView={handleViewInvoice} 
          />
        </ScrollAnimation>
      </div>
    </>
  );
};

export default Invoices;
