import { useState } from 'react';
import { Invoice } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { useInvoices, FilterStatus, SortOrder } from '@/hooks/useInvoices';
import { InvoiceCard } from './InvoiceCard';
import { InvoiceFilters } from './InvoiceFilters';
import { Loader2 } from 'lucide-react';

export function InvoiceList() {
  // State for filters and pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch invoices with current filters
  const { 
    invoices, 
    isLoading, 
    error, 
    totalPages
  } = useInvoices(sortOrder, currentPage, filterStatus, searchQuery);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle filter changes
  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setCurrentPage(0); // Reset to first page when filter changes
  };

  // Handle sort changes
  const handleSortChange = (order: SortOrder) => {
    setSortOrder(order);
    setCurrentPage(0); // Reset to first page when sort changes
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(0); // Reset to first page when search changes
  };

  // Handle view details for an invoice
  const handleViewDetails = (invoiceId: string) => {
    // Implementation will be added later
    console.log('View details for invoice:', invoiceId);
  };

  // Handle export PDF
  const handleExportPdf = (invoiceId: string) => {
    // Implementation will be added later
    console.log('Export PDF for invoice:', invoiceId);
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Manage your customer invoices</CardDescription>
            </div>
            <Button variant="default">New Invoice</Button>
          </div>
        </CardHeader>
        <CardContent>
          <InvoiceFilters 
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            onSearch={handleSearch}
            currentFilter={filterStatus}
            currentSort={sortOrder}
            searchQuery={searchQuery}
          />

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-6">
              Error loading invoices. Please try again.
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center text-muted-foreground p-6">
              No invoices found. Try adjusting your filters or create a new invoice.
            </div>
          ) : (
            <div className="grid gap-6 mt-6">
              {invoices.map((invoice) => (
                <InvoiceCard 
                  key={invoice.id}
                  invoice={invoice}
                  onViewDetails={() => handleViewDetails(invoice.id)}
                  onExportPdf={() => handleExportPdf(invoice.id)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination 
                totalPages={totalPages} 
                currentPage={currentPage} 
                onPageChange={handlePageChange} 
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 