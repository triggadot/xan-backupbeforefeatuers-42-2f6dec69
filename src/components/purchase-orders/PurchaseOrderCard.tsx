import { format } from 'date-fns';
import { MoreHorizontal, ArrowUpRight, Download, Eye } from 'lucide-react';
import { PurchaseOrder } from '@/types';
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

interface PurchaseOrderCardProps {
  purchaseOrder: PurchaseOrder & { paymentStatus?: string };
  onViewPayments: () => void;
  onExportPdf: () => void;
}

export function PurchaseOrderCard({ 
  purchaseOrder, 
  onViewPayments, 
  onExportPdf 
}: PurchaseOrderCardProps) {
  // Format dates for display
  const formattedDate = purchaseOrder.date 
    ? format(new Date(purchaseOrder.date), 'PPP') 
    : 'N/A';
  
  const formattedDueDate = purchaseOrder.dueDate 
    ? format(new Date(purchaseOrder.dueDate), 'PPP') 
    : 'N/A';

  const getStatusBadgeVariant = (status: string | undefined) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'UNPAID':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Get vendor initials for avatar
  const getVendorInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://avatar.vercel.sh/${purchaseOrder.accountName}.png`} />
              <AvatarFallback>{getVendorInitials(purchaseOrder.accountName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{purchaseOrder.number}</CardTitle>
              <CardDescription>{purchaseOrder.accountName}</CardDescription>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(purchaseOrder.paymentStatus) as "default" | "secondary" | "destructive" | "outline" | "success" | "warning"}>
            {purchaseOrder.paymentStatus || 'Unknown'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Order Date</p>
            <p>{formattedDate}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Expected Delivery</p>
            <p>{purchaseOrder.expectedDeliveryDate 
              ? format(new Date(purchaseOrder.expectedDeliveryDate), 'PPP') 
              : 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
            <p className="font-medium">{formatCurrency(purchaseOrder.total)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Balance Due</p>
            <p className="font-medium">{formatCurrency(purchaseOrder.balance || 0)}</p>
          </div>
        </div>

        {purchaseOrder.lineItems && purchaseOrder.lineItems.length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <h4 className="font-medium mb-2">Items</h4>
              <ul className="space-y-1">
                {purchaseOrder.lineItems.slice(0, 3).map((item) => (
                  <li key={item.id} className="text-sm flex justify-between">
                    <span>{item.description} (x{item.quantity})</span>
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                  </li>
                ))}
                {purchaseOrder.lineItems.length > 3 && (
                  <li className="text-sm text-muted-foreground">
                    +{purchaseOrder.lineItems.length - 3} more items
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="bg-muted/20 flex justify-between items-center">
        <Button variant="secondary" size="sm" onClick={onViewPayments}>
          <Eye className="mr-1 h-4 w-4" />
          View Payments
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
              <DropdownMenuItem>Edit Purchase Order</DropdownMenuItem>
              <DropdownMenuItem>Add Payment</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Share with Vendor</DropdownMenuItem>
              <DropdownMenuItem>Mark as Received</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Delete Purchase Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
} 