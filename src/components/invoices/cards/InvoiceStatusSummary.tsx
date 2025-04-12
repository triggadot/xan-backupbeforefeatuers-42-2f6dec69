
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Clock, FileText, CircleDollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { InvoiceWithAccount } from '@/types/new/invoice';

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
  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter(inv => inv.payment_status?.toLowerCase() === 'paid').length;
    const unpaid = invoices.filter(inv => inv.payment_status?.toLowerCase() === 'unpaid').length;
    const partial = invoices.filter(inv => inv.payment_status?.toLowerCase() === 'partial').length;
    const draft = invoices.filter(inv => inv.payment_status?.toLowerCase() === 'draft').length;
    
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const paidAmount = invoices
      .filter(inv => inv.payment_status?.toLowerCase() === 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const unpaidAmount = invoices
      .filter(inv => ['unpaid', 'partial'].includes(inv.payment_status?.toLowerCase() || ''))
      .reduce((sum, inv) => sum + (inv.balance || 0), 0);
    
    return {
      total, paid, unpaid, partial, draft,
      totalAmount, paidAmount, unpaidAmount
    };
  }, [invoices]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md", 
          selectedStatus === 'all' && "border-primary shadow-sm"
        )}
        onClick={() => onSelectStatus('all')}
      >
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <div className="flex items-center mb-1">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm font-medium">All</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.totalAmount)}</p>
          </div>
          <CircleDollarSign className="h-10 w-10 text-gray-200" />
        </CardContent>
      </Card>
      
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md", 
          selectedStatus === 'paid' && "border-green-500 shadow-sm"
        )}
        onClick={() => onSelectStatus('paid')}
      >
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <div className="flex items-center mb-1">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-sm font-medium">Paid</span>
            </div>
            <p className="text-2xl font-bold">{stats.paid}</p>
            <p className="text-xs text-green-600">{formatCurrency(stats.paidAmount)}</p>
          </div>
          <CheckCircle className="h-10 w-10 text-green-100" />
        </CardContent>
      </Card>
      
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md", 
          selectedStatus === 'unpaid' && "border-red-500 shadow-sm"
        )}
        onClick={() => onSelectStatus('unpaid')}
      >
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <div className="flex items-center mb-1">
              <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
              <span className="text-sm font-medium">Unpaid</span>
            </div>
            <p className="text-2xl font-bold">{stats.unpaid}</p>
            <p className="text-xs text-red-600">{formatCurrency(stats.unpaidAmount)}</p>
          </div>
          <AlertCircle className="h-10 w-10 text-red-100" />
        </CardContent>
      </Card>
      
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md", 
          selectedStatus === 'partial' && "border-amber-500 shadow-sm"
        )}
        onClick={() => onSelectStatus('partial')}
      >
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <div className="flex items-center mb-1">
              <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
              <span className="text-sm font-medium">Partial</span>
            </div>
            <p className="text-2xl font-bold">{stats.partial}</p>
            <p className="text-xs text-amber-600">Partially Paid</p>
          </div>
          <AlertCircle className="h-10 w-10 text-amber-100" />
        </CardContent>
      </Card>
      
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md", 
          selectedStatus === 'draft' && "border-gray-500 shadow-sm"
        )}
        onClick={() => onSelectStatus('draft')}
      >
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <div className="flex items-center mb-1">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm font-medium">Draft</span>
            </div>
            <p className="text-2xl font-bold">{stats.draft}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <Clock className="h-10 w-10 text-gray-100" />
        </CardContent>
      </Card>
    </div>
  );
};
