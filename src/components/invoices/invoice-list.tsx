
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { InvoiceWithAccount } from '@/types/invoices/invoice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AmountDisplay } from '@/components/common/AmountDisplay';

interface InvoiceListProps {
  invoices: InvoiceWithAccount[];
  isLoading?: boolean;
  onSearch?: (query: string) => void;
  onStatusFilter?: (status: string) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  isLoading = false,
  onSearch,
  onStatusFilter,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    if (onStatusFilter) {
      onStatusFilter(value);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge variant="success">{status.toUpperCase()}</Badge>;
      case 'partial':
        return <Badge variant="warning">{status.toUpperCase()}</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">{status.toUpperCase()}</Badge>;
      case 'credit':
        return <Badge variant="secondary">{status.toUpperCase()}</Badge>;
      default:
        return <Badge variant="secondary">{status.toUpperCase()}</Badge>;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesAccount = invoice.gl_accounts?.account_name?.toLowerCase().includes(searchLower);
      const matchesNumber = invoice.invoice_uid?.toLowerCase().includes(searchLower) ||
                           invoice.id?.toLowerCase().includes(searchLower);
      
      if (!matchesAccount && !matchesNumber) {
        return false;
      }
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      return invoice.payment_status?.toLowerCase() === statusFilter.toLowerCase();
    }
    
    return true;
  });

  const handleRowClick = (id: string) => {
    navigate(`/invoices/${id}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(invoice.id)}
                  >
                    <TableCell className="font-medium">{invoice.invoice_uid || `INV-${invoice.id.substring(0, 6)}`}</TableCell>
                    <TableCell>{formatDate(invoice.invoice_order_date)}</TableCell>
                    <TableCell>{invoice.gl_accounts?.account_name || 'N/A'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.total_amount || 0)}</TableCell>
                    <TableCell className="text-right">
                      <AmountDisplay 
                        amount={invoice.balance || 0} 
                        variant={(invoice.balance || 0) > 0 ? 'destructive' : 'success'}
                      />
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.payment_status || 'draft')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceList;
