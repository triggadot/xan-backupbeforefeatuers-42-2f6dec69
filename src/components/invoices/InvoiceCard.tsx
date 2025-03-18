import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, MoreHorizontal, ArrowUpRight, Download, Eye } from 'lucide-react';
import { Invoice, LineItem } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/formatters';

interface InvoiceCardProps {
  invoice: Invoice;
  onViewDetails: () => void;
  onExportPdf: () => void;
}

export function InvoiceCard({ 
  invoice, 
  onViewDetails, 
  onExportPdf 
}: InvoiceCardProps) {
  // State for expanded view to show line items
  const [expanded, setExpanded] = useState(false);

  // Format dates for display
  const formattedDate = invoice.date 
    ? format(new Date(invoice.date), 'PPP') 
    : 'N/A';
  
  const formattedDueDate = invoice.dueDate 
    ? format(new Date(invoice.dueDate), 'PPP') 
    : 'N/A';

  const formattedPaymentDate = invoice.paymentDate 
    ? format(new Date(invoice.paymentDate), 'PPP') 
    : null;

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'overdue':
        return 'destructive';
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'warning';
      default:
        return 'outline';
    }
  };

  // Get customer initials for avatar
  const getCustomerInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Card>
      <CardHeader className="bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://avatar.vercel.sh/${invoice.accountName}.png`} />
              <AvatarFallback>{getCustomerInitials(invoice.accountName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{invoice.number}</CardTitle>
              <CardDescription>{invoice.accountName}</CardDescription>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(invoice.status) as "default" | "secondary" | "destructive" | "outline" | "success" | "warning"}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
            <p>{formattedDate}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Due Date</p>
            <p>{formattedDueDate}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
            <p className="font-medium">{formatCurrency(invoice.total)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Balance</p>
            <p className="font-medium">{formatCurrency(invoice.balance)}</p>
          </div>
        </div>

        {invoice.status === 'paid' && formattedPaymentDate && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Payment received on:</span> {formattedPaymentDate}
          </div>
        )}

        {expanded && invoice.lineItems && invoice.lineItems.length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <h4 className="font-medium mb-2">Line Items</h4>
              <div className="space-y-2">
                {invoice.lineItems.map((item: LineItem) => (
                  <div key={item.id} className="grid grid-cols-3 text-sm">
                    <div className="col-span-2">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-muted-foreground">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div className="text-right font-medium">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-sm font-medium">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.tax > 0 && (
                <div className="flex justify-between mt-1 text-sm">
                  <span>Tax</span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
              )}
              <div className="flex justify-between mt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="bg-muted/20 flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleExpanded}
          className="gap-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show Details
            </>
          )}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExportPdf}>
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={onViewDetails}>
                View Details
                <ArrowUpRight className="ml-auto h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem>Edit Invoice</DropdownMenuItem>
              <DropdownMenuItem>Record Payment</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Email to Customer</DropdownMenuItem>
              <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Delete Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
} 