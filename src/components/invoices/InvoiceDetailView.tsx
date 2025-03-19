
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, User, CreditCard, Package, ExternalLink } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { formatCurrency } from '@/utils/format-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from 'react-router-dom';

const InvoiceDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoice, isLoading } = useInvoices();
  const [invoice, setInvoice] = React.useState<any>(null);

  React.useEffect(() => {
    if (id) {
      const fetchInvoiceData = async () => {
        const data = await getInvoice(id);
        setInvoice(data);
      };
      fetchInvoiceData();
    }
  }, [id, getInvoice]);

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
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container max-w-6xl py-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Invoice Not Found</h1>
        </div>
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">The requested invoice could not be found. It may have been deleted or you may not have permission to view it.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/invoices')}>Back to Invoices</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Invoice #{invoice.number}</h1>
          <Badge variant={getStatusVariant(invoice.status)} className="capitalize ml-2">
            {invoice.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit Invoice</Button>
          <Button>Record Payment</Button>
        </div>
      </div>

      {/* Invoice information cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={`/accounts/${invoice.accountId}`} className="font-medium hover:underline text-blue-600">
              {invoice.accountName}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Date:</span>
              <span>{formatDate(invoice.date)}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid:</span>
              <span className="font-medium">{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-medium font-bold">{formatCurrency(invoice.balance)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
          <CardDescription>Products and services included in this invoice</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.productDetails ? (
                      <div className="flex items-center gap-2">
                        {item.productDetails.product_image1 && (
                          <div className="h-10 w-10 rounded-md border overflow-hidden flex-shrink-0">
                            <img 
                              src={item.productDetails.product_image1} 
                              alt={item.description}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <Link 
                          to={`/products/${item.productDetails.id}`}
                          className="font-medium hover:underline text-blue-600 flex items-center gap-1"
                        >
                          {item.productDetails.name} <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    ) : (
                      item.description
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {item.productDetails?.purchase_notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-end border-t p-4">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>Payments made against this invoice</CardDescription>
        </CardHeader>
        <CardContent>
          {invoice.payments && invoice.payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.method || '-'}</TableCell>
                    <TableCell>{payment.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No payments have been recorded for this invoice.
            </div>
          )}
        </CardContent>
        {invoice.status !== 'paid' && (
          <CardFooter className="border-t">
            <Button>Record New Payment</Button>
          </CardFooter>
        )}
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvoiceDetailView;
