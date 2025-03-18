
import React from 'react';
import { Invoice } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/mapping-utils';
import { ArrowRight, Calendar, FileText, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InvoiceCardProps {
  invoice: Invoice;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice }) => {
  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" | "warning" => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'overdue':
        return 'destructive';
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link to={`/invoices/${invoice.id}`} className="block transition-transform hover:translate-y-[-2px]">
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1 truncate">Invoice #{invoice.number}</h3>
              
              <div className="flex gap-1 items-center text-sm text-muted-foreground mb-2">
                <User size={14} />
                <span className="truncate">{invoice.accountName}</span>
              </div>
              
              <div className="flex gap-1 items-center text-sm text-muted-foreground">
                <Calendar size={14} />
                <span>{formatDate(invoice.date)}</span>
                {invoice.dueDate && (
                  <>
                    <ArrowRight size={14} />
                    <span>{formatDate(invoice.dueDate)}</span>
                  </>
                )}
              </div>
              
              <div className="flex gap-1 items-center text-sm text-muted-foreground">
                <FileText size={14} />
                <span>{invoice.lineItems.length} items</span>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <Badge 
                  variant={getStatusVariant(invoice.status)}
                  className="capitalize"
                >
                  {invoice.status}
                </Badge>
                
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
    </Link>
  );
};

export default InvoiceCard;
