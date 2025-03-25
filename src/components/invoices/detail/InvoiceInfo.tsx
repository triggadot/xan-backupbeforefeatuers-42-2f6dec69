
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InvoiceWithDetails } from '@/types/invoice';
import { formatCurrency } from '@/utils/format-utils';
import { format } from 'date-fns';
import { BadgeCheck, Send, Plus } from 'lucide-react';

interface InvoiceInfoProps {
  invoice: InvoiceWithDetails;
  onAddPayment: () => void;
}

export function InvoiceInfo({ invoice, onAddPayment }: InvoiceInfoProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Invoice Information</h3>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-muted-foreground">Invoice Number</div>
          <div className="font-medium text-right">{invoice.invoiceNumber}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="text-muted-foreground">Invoice Date</div>
          <div className="font-medium text-right">
            {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'PPP') : 'Not specified'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="text-muted-foreground">Due Date</div>
          <div className="font-medium text-right">
            {invoice.dueDate ? format(new Date(invoice.dueDate), 'PPP') : 'Not specified'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="text-muted-foreground">Status</div>
          <div className="font-medium text-right">
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {invoice.status === 'paid' && <BadgeCheck className="mr-1 h-3 w-3" />}
              {invoice.status === 'sent' && <Send className="mr-1 h-3 w-3" />}
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t mt-4 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-muted-foreground">Subtotal</div>
          <div className="font-medium text-right">{formatCurrency(invoice.subtotal || 0)}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="text-muted-foreground">Amount Paid</div>
          <div className="font-medium text-right">{formatCurrency(invoice.total_paid || 0)}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2 text-lg">
          <div className="font-medium">Balance Due</div>
          <div className="font-bold text-right">{formatCurrency(invoice.balance || 0)}</div>
        </div>
      </div>
      
      {invoice.status !== 'paid' && (
        <div className="mt-4">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onAddPayment}
          >
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      )}
    </Card>
  );
}
