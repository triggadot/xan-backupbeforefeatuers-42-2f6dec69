
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoicesNew } from '@/hooks/invoices/useInvoicesNew';
import InvoiceList from '@/components/invoices/list/InvoiceList';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

const Invoices = () => {
  const navigate = useNavigate();
  const { fetchInvoices, isLoading, error } = useInvoicesNew();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const loadInvoices = async () => {
      const result = await fetchInvoices();
      if (result && result.data) {
        setData(result.data);
      }
    };
    
    loadInvoices();
  }, [fetchInvoices]);

  const handleViewInvoice = (id: string) => {
    navigate(`/invoices/${id}`);
  };

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Button onClick={() => navigate('/invoices/new')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <InvoiceList
        invoices={data}
        isLoading={isLoading}
        error={error}
        onView={handleViewInvoice}
      />
    </div>
  );
};

export default Invoices;
