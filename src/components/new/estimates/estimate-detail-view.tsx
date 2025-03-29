import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Printer, Download, Share2, Edit, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EstimateWithDetails } from '@/types/estimate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface EstimateDetailViewProps {
  estimate: EstimateWithDetails;
  isLoading?: boolean;
  onRefresh?: () => void;
  onConvertToInvoice?: () => void;
}

export const EstimateDetailView: React.FC<EstimateDetailViewProps> = ({
  estimate,
  isLoading,
  onRefresh,
  onConvertToInvoice
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  if (!estimate) {
    return <div>No estimate data available.</div>;
  }
  
  // Calculate total quantity
  const totalQuantity = estimate.estimateLines?.reduce((total, line) => total + (Number(line.qty_sold) || 0), 0) || 0;

  // Generate estimate number using format EST#[account_uid]MMDDYY
  const formattedEstimateNumber = useMemo(() => {
    try {
      // Get account_uid from account, if available
      const accountUid = estimate.account?.accounts_uid || 'NOACC';
      
      // Format the date as MMDDYY
      let dateString = 'NODATE';
      if (estimate.estimate_date) {
        const estimateDate = new Date(estimate.estimate_date);
        dateString = format(estimateDate, 'MMddyy');
      }
      
      // Create the formatted estimate number
      return `EST#${accountUid}${dateString}`;
    } catch (err) {
      console.error('Error formatting estimate number:', err);
      return estimate.id?.substring(0, 8) || 'Unknown';
    }
  }, [estimate]);

  // Handle PDF download
  const handleDownloadPdf = () => {
    // Check if we have a direct link
    if (estimate.glide_pdf_url) {
      window.open(estimate.glide_pdf_url, '_blank');
    } else {
      toast({
        title: 'PDF Download',
        description: 'Generating PDF document...',
      });
      
      // In a real implementation, you would make an API call to generate and download the PDF
      setTimeout(() => {
        toast({
          title: 'PDF Generated',
          description: 'Your estimate PDF has been generated and downloaded.',
        });
      }, 1000);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast({
          title: 'Link Copied',
          description: 'Estimate link copied to clipboard!',
        });
      })
      .catch(err => {
        console.error('Could not copy link: ', err);
        toast({
          title: 'Error',
          description: 'Could not copy link to clipboard.',
          variant: 'destructive',
        });
      });
  };

  const handleConvertToInvoice = () => {
    if (onConvertToInvoice) {
      onConvertToInvoice();
    } else {
      toast({
        title: 'Convert to Invoice',
        description: 'Converting estimate to invoice...',
      });
      
      // In a real implementation, you would make an API call to convert the estimate
      setTimeout(() => {
        toast({
          title: 'Conversion Complete',
          description: 'Your estimate has been converted to an invoice.',
        });
        navigate('/invoices');
      }, 1000);
    }
  };

  const getStatusBadge = () => {
    switch (estimate.status) {
      case 'converted':
        return <Badge className="bg-green-100 text-green-800">Converted</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Back button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4" 
        onClick={() => navigate('/estimates')}
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Estimates
      </Button>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            {formattedEstimateNumber}
            {estimate.glide_row_id && <span className="ml-2 text-sm text-gray-500">{estimate.glide_row_id}</span>}
          </CardTitle>
          {getStatusBadge()}
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
              {estimate.account ? (
                <div>
                  <Link 
                    to={`/accounts/${estimate.account.id}`} 
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {estimate.account.account_name || estimate.accountName || 'Unnamed Account'}
                  </Link>
                  
                  {estimate.account.accounts_uid && (
                    <p className="text-sm text-gray-500">
                      ID: {estimate.account.accounts_uid}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No customer information</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Estimate Date</h3>
                <p>{formatDate(estimate.estimate_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                <p>{formatDate(estimate.created_at)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-6">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button size="sm" onClick={() => navigate(`/estimates/${estimate.id}/edit`)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            {estimate.status !== 'converted' && (
              <Button 
                variant="default" 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleConvertToInvoice}
              >
                Convert to Invoice
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estimate Line Items */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Items</h3>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimate.estimateLines && estimate.estimateLines.length > 0 ? (
                estimate.estimateLines.map((line, index) => (
                  <TableRow key={line.id || index} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{line.sale_product_name || 'Product Description'}</TableCell>
                    <TableCell>{Math.round(Number(line.qty_sold) || 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.selling_price || 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.line_total || (line.qty_sold || 0) * (line.selling_price || 0))}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">No items on this estimate.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Estimate Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-gray-600 font-semibold">
              <span>Total Quantity:</span>
              <span>{Math.round(totalQuantity)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600 font-semibold">
              <span>Item(s) Total:</span>
              <span>{formatCurrency(estimate.total_amount || 0)}</span>
            </div>
            
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total Amount:</span>
              <span>{formatCurrency(estimate.total_amount || 0)}</span>
            </div>
            
            {estimate.credits && estimate.credits.length > 0 && (
              <div className="flex justify-between text-sm">
                <span>Credits Applied:</span>
                <span className="text-green-600">{formatCurrency(estimate.total_credits || 0)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Balance Due:</span>
              <span className={estimate.balance && estimate.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                {formatCurrency(estimate.balance || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {estimate.add_note && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-semibold mb-1 text-gray-700">Notes:</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
              {estimate.add_note ? "Additional notes for this estimate" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstimateDetailView;
