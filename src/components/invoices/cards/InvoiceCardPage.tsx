
import React, { useState, useEffect } from 'react';
import { useInvoices } from '@/hooks/invoices';
import { InvoiceCardGrid } from './InvoiceCardGrid';
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  SlidersHorizontal,
  CalendarIcon,
  ChevronDownIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InvoiceStatusSummary } from './InvoiceStatusSummary';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/utils/use-toast';
import { InvoiceWithAccount } from '@/types/new/invoice';

const InvoiceCardPage: React.FC = () => {
  const { invoices, isLoading } = useInvoices();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const { toast } = useToast();

  // Convert old invoice types to new invoice types for rendering
  const convertedInvoices: InvoiceWithAccount[] = invoices.map(invoice => ({
    id: invoice.id,
    glide_row_id: invoice.glideRowId || invoice.glide_row_id || '',
    rowid_accounts: invoice.customerId || invoice.rowid_accounts || '',
    invoice_order_date: invoice.invoiceDate ? invoice.invoiceDate.toISOString() : invoice.invoice_order_date || '',
    created_timestamp: invoice.createdAt ? invoice.createdAt.toISOString() : invoice.created_at || '',
    submitted_timestamp: '',
    user_email: '',
    notes: invoice.notes || '',
    doc_glideforeverlink: '',
    created_at: invoice.createdAt ? invoice.createdAt.toISOString() : invoice.created_at || '',
    updated_at: invoice.updatedAt ? invoice.updatedAt.toISOString() : invoice.updated_at || '',
    total_amount: invoice.total_amount || invoice.total || 0,
    total_paid: invoice.total_paid || invoice.amountPaid || 0,
    balance: invoice.balance || 0,
    payment_status: invoice.status || invoice.payment_status || 'draft',
    invoice_uid: invoice.invoiceNumber || invoice.invoice_uid || '',
    account: invoice.account,
    lines: []
  }));

  // Apply filters
  const filteredInvoices = convertedInvoices.filter(invoice => {
    // Search filter
    const matchesSearch = 
      (invoice.account?.account_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.invoice_uid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      statusFilter === 'all' || 
      invoice.payment_status?.toLowerCase() === statusFilter.toLowerCase();
    
    // Time filter
    let matchesTime = true;
    if (timeFilter !== 'all' && invoice.invoice_order_date) {
      const invoiceDate = new Date(invoice.invoice_order_date);
      const now = new Date();
      
      switch (timeFilter) {
        case 'last30':
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          matchesTime = invoiceDate >= thirtyDaysAgo;
          break;
        case 'last90':
          const ninetyDaysAgo = new Date(now);
          ninetyDaysAgo.setDate(now.getDate() - 90);
          matchesTime = invoiceDate >= ninetyDaysAgo;
          break;
        case 'thisYear':
          matchesTime = invoiceDate.getFullYear() === now.getFullYear();
          break;
        default:
          matchesTime = true;
      }
    }
    
    return matchesSearch && matchesStatus && matchesTime;
  });

  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
  };

  const handleExportInvoices = () => {
    toast({
      title: 'Export Started',
      description: 'Your invoices are being prepared for export.',
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your customer invoices
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <FilterIcon className="mr-2 h-4 w-4" />
                Export
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleExportInvoices}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportInvoices}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Link to="/invoices/new">
            <Button size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Summary Cards */}
      <InvoiceStatusSummary invoices={convertedInvoices} selectedStatus={statusFilter} onSelectStatus={setStatusFilter} />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by customer, invoice number..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <FilterIcon className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-48">
            <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
              <SelectTrigger>
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Time period" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="last90">Last 90 Days</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="icon" className="hidden sm:flex">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Invoice Grid */}
      <InvoiceCardGrid invoices={filteredInvoices} isLoading={isLoading} />
    </div>
  );
};

export default InvoiceCardPage;
