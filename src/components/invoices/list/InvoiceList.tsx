
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/format-utils';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: Date;
  total: number;
  status: string;
}

interface InvoiceListProps {
  invoices: InvoiceItem[];
  isLoading: boolean;
  error: string | null;
  onView: (id: string) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, isLoading, error, onView }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-16 bg-gray-100 rounded-md" />
        <div className="animate-pulse h-16 bg-gray-100 rounded-md" />
        <div className="animate-pulse h-16 bg-gray-100 rounded-md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error loading invoices: {error}</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No invoices found.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Partial</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Draft</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Overdue</Badge>;
      case 'sent':
      default:
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Sent</Badge>;
    }
  };

  return (
    <div className="space-y-2">
      {invoices.map((invoice) => (
        <Card key={invoice.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="font-medium">{invoice.invoiceNumber}</div>
                <div className="text-sm text-muted-foreground">{invoice.customerName}</div>
              </div>
              
              <div className="text-right space-y-1">
                <div>{formatCurrency(invoice.total)}</div>
                <div className="text-sm text-muted-foreground">
                  {invoice.date ? format(new Date(invoice.date), 'MMM dd, yyyy') : 'No date'}
                </div>
              </div>
              
              <div className="flex space-x-2 items-center">
                {getStatusBadge(invoice.status)}
                <Button variant="ghost" size="sm" onClick={() => onView(invoice.id)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InvoiceList;
