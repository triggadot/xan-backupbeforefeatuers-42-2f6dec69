
import React from 'react';
import { Invoice } from '@/types';
import InvoiceCard from './InvoiceCard';
import { Spinner } from '@/components/ui/spinner';

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-muted p-8 rounded-md text-center">
        <h3 className="font-medium text-lg mb-2">No invoices found</h3>
        <p className="text-muted-foreground">Create your first invoice to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {invoices.map((invoice) => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  );
};

export default InvoiceList;
