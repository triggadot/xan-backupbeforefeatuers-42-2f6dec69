
import React from 'react';
import { InvoiceWithAccount } from '@/types/new/invoice';
import { InvoiceCard } from './InvoiceCard';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InvoiceCardGridProps {
  invoices: InvoiceWithAccount[];
  isLoading: boolean;
}

export const InvoiceCardGrid: React.FC<InvoiceCardGridProps> = ({ invoices, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <FileText className="h-10 w-10 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium">No invoices found</h3>
        <p className="text-gray-500 mt-1">Create your first invoice to get started</p>
        <Link to="/invoices/new">
          <Button className="mt-4">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {invoices.map(invoice => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  );
};

import { FileText } from 'lucide-react';
