
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  DollarSign, 
  FileText,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { InvoiceWithAccount } from '@/types/invoices/invoice';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { InvoiceLinesList } from './InvoiceLinesList';
import { InvoicePaymentsDialog } from './InvoicePaymentsDialog';

interface InvoiceCardProps {
  invoice: InvoiceWithAccount;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);

  // Format invoice number from data
  const invoiceNumber = invoice.invoice_uid || `INV-${invoice.id.substring(0, 6)}`;

  // Handle expand/collapse
  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };
  
  // Handle payments dialog
  const showPayments = (e: React.MouseEvent) => {
    e.preventDefault();
    setPaymentsOpen(true);
  };

  return (
    <Card className={`h-full transition-all duration-300 ${isExpanded ? 'shadow-lg' : 'hover:shadow-md'} hover:border-primary/50`}>
      <Link to={`/invoice-cards/${invoice.id}`} className="block">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium truncate">{invoiceNumber}</span>
          </div>
          <InvoiceStatusBadge status={invoice.payment_status as any} size="sm" />
        </CardHeader>
        
        <CardContent className="p-4 pt-1 pb-0">
          <div className="space-y-2">
            <div className="text-lg font-semibold truncate">
              {invoice.account?.account_name || "No Customer"}
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(invoice.invoice_order_date)}</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 flex justify-between items-center border-t mt-2">
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="h-4 w-4 mr-1" />
            <span className="text-sm">{formatCurrency(invoice.total_amount || 0)}</span>
          </div>
          {invoice.balance > 0 && (
            <div className="flex items-center text-sm text-amber-500">
              <CreditCard className="h-4 w-4 mr-1" />
              <span>{formatCurrency(invoice.balance)}</span>
            </div>
          )}
        </CardFooter>
      </Link>

      {/* Expandable Actions Row */}
      <div className="px-4 py-2 border-t flex justify-between items-center bg-gray-50/50">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleExpand} 
          className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <>Hide Details <ChevronUp className="h-3 w-3 ml-1" /></>
          ) : (
            <>Show Details <ChevronDown className="h-3 w-3 ml-1" /></>
          )}
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={showPayments}
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            Payments
          </Button>
          
          <Link to={`/invoice-cards/${invoice.id}`}>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3 mr-1" /> View
            </Button>
          </Link>
        </div>
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="p-4 border-t bg-gray-50/30 animate-slideDown">
          <InvoiceLinesList invoice={invoice} />
        </div>
      )}

      {/* Payments Dialog */}
      <InvoicePaymentsDialog
        invoice={invoice}
        open={paymentsOpen}
        onClose={() => setPaymentsOpen(false)}
      />
    </Card>
  );
};
