
import React from 'react';
import { InvoiceWithAccount } from '@/types/new/invoice';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface InvoiceStatusSummaryProps {
  invoices: InvoiceWithAccount[];
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

export const InvoiceStatusSummary: React.FC<InvoiceStatusSummaryProps> = ({ 
  invoices,
  selectedStatus,
  onSelectStatus 
}) => {
  // Calculate status metrics
  const allCount = invoices.length;
  const allTotal = invoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  
  const paidInvoices = invoices.filter(invoice => invoice.payment_status?.toLowerCase() === 'paid');
  const paidCount = paidInvoices.length;
  const paidTotal = paidInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  
  const unpaidInvoices = invoices.filter(invoice => invoice.payment_status?.toLowerCase() === 'unpaid');
  const unpaidCount = unpaidInvoices.length;
  const unpaidTotal = unpaidInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  
  const partialInvoices = invoices.filter(invoice => invoice.payment_status?.toLowerCase() === 'partial');
  const partialCount = partialInvoices.length;
  const partialTotal = partialInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  
  const draftInvoices = invoices.filter(invoice => invoice.payment_status?.toLowerCase() === 'draft');
  const draftCount = draftInvoices.length;
  const draftTotal = draftInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card 
        className={`cursor-pointer transition-colors ${selectedStatus === 'all' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
        onClick={() => onSelectStatus('all')}
      >
        <CardContent className="p-4 flex flex-col">
          <span className="text-sm text-muted-foreground">All Invoices</span>
          <span className="text-2xl font-bold mt-1">{allCount}</span>
          <span className="text-sm font-medium mt-1">{formatCurrency(allTotal)}</span>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-colors ${selectedStatus === 'paid' ? 'border-emerald-500 bg-emerald-50' : 'hover:border-emerald-500/50'}`}
        onClick={() => onSelectStatus('paid')}
      >
        <CardContent className="p-4 flex flex-col">
          <span className="text-sm text-muted-foreground">Paid</span>
          <span className="text-2xl font-bold mt-1 text-emerald-600">{paidCount}</span>
          <span className="text-sm font-medium mt-1">{formatCurrency(paidTotal)}</span>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-colors ${selectedStatus === 'unpaid' ? 'border-red-500 bg-red-50' : 'hover:border-red-500/50'}`}
        onClick={() => onSelectStatus('unpaid')}
      >
        <CardContent className="p-4 flex flex-col">
          <span className="text-sm text-muted-foreground">Unpaid</span>
          <span className="text-2xl font-bold mt-1 text-red-600">{unpaidCount}</span>
          <span className="text-sm font-medium mt-1">{formatCurrency(unpaidTotal)}</span>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-colors ${selectedStatus === 'partial' ? 'border-amber-500 bg-amber-50' : 'hover:border-amber-500/50'}`}
        onClick={() => onSelectStatus('partial')}
      >
        <CardContent className="p-4 flex flex-col">
          <span className="text-sm text-muted-foreground">Partial</span>
          <span className="text-2xl font-bold mt-1 text-amber-600">{partialCount}</span>
          <span className="text-sm font-medium mt-1">{formatCurrency(partialTotal)}</span>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-colors ${selectedStatus === 'draft' ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-500/50'}`}
        onClick={() => onSelectStatus('draft')}
      >
        <CardContent className="p-4 flex flex-col">
          <span className="text-sm text-muted-foreground">Draft</span>
          <span className="text-2xl font-bold mt-1 text-blue-600">{draftCount}</span>
          <span className="text-sm font-medium mt-1">{formatCurrency(draftTotal)}</span>
        </CardContent>
      </Card>
    </div>
  );
};
