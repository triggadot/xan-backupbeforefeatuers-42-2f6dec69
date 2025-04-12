
import React, { useState } from 'react';
import { InvoiceWithAccount } from '@/types/new/invoice';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  FileText, 
  DollarSign, 
  Share2, 
  Printer, 
  Download,
  User
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { InvoiceLinesList } from './InvoiceLinesList';
import { InvoicePaymentsDialog } from './InvoicePaymentsDialog';
import { PDFActions } from '@/components/pdf/PDFActions';
import { DocumentType } from '@/types/documents';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface InvoiceCardDetailProps {
  invoice: InvoiceWithAccount;
}

export const InvoiceCardDetail: React.FC<InvoiceCardDetailProps> = ({ invoice }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  
  // Format invoice number
  const invoiceNumber = invoice.invoice_uid || `INV-${invoice.id.substring(0, 6)}`;
  
  // Calculate values
  const subtotal = invoice.total_amount || 0;
  const itemCount = invoice.lines?.length || 0;
  
  return (
    <div className="space-y-6">
      {/* Header with navigation and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link to="/invoice-cards">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPaymentsOpen(true)}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Payments
          </Button>
          
          <PDFActions 
            documentType={DocumentType.INVOICE}
            document={invoice} 
            variant="outline" 
            size="sm" 
            showLabels={true} 
            onPDFGenerated={url => setPdfUrl(url)} 
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card className="shadow-md">
        <CardHeader className="border-b pb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Invoice #{invoiceNumber}</CardTitle>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{formatDate(invoice.invoice_order_date)}</span>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <InvoiceStatusBadge status={invoice.payment_status as any} size="default" />
              <div className="text-sm text-muted-foreground">
                {invoice.balance > 0 
                  ? `Balance: ${formatCurrency(invoice.balance)}` 
                  : 'Paid in Full'}
              </div>
            </div>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 border-b">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="history">Payment History</TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="p-6">
            <TabsContent value="details" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4 col-span-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 rounded-full p-2 mt-1">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.account?.account_name || 'No Customer'}</p>
                        {invoice.account?.accounts_uid && (
                          <p className="text-sm text-muted-foreground">{invoice.account.accounts_uid}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {invoice.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                      <p className="text-gray-700 whitespace-pre-wrap p-3 bg-gray-50 rounded-md border">
                        {invoice.notes}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="md:border-l md:pl-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
                      </span>
                      <AmountDisplay amount={subtotal} />
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid</span>
                      <AmountDisplay 
                        amount={invoice.total_paid || 0} 
                        variant={invoice.total_paid ? 'success' : 'default'} 
                      />
                    </div>
                    
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Balance</span>
                      <AmountDisplay 
                        amount={invoice.balance || 0} 
                        variant={invoice.balance === 0 ? 'success' : invoice.balance > 0 ? 'destructive' : 'default'} 
                        className="font-bold" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="items" className="mt-0">
              <InvoiceLinesList invoice={invoice} />
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Payment History</h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setPaymentsOpen(true)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    View All Payments
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                    <div className="text-lg font-bold">
                      {formatCurrency(invoice.total_amount || 0)}
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Amount Paid</div>
                    <div className="text-lg font-bold text-emerald-600">
                      {formatCurrency(invoice.total_paid || 0)}
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Balance</div>
                    <div className={`text-lg font-bold ${invoice.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {formatCurrency(invoice.balance || 0)}
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Payments Dialog */}
      <InvoicePaymentsDialog
        invoice={invoice}
        open={paymentsOpen}
        onClose={() => setPaymentsOpen(false)}
      />
    </div>
  );
};
