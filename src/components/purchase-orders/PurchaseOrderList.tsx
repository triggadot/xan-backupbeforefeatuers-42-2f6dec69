import { useState } from 'react';
import { PurchaseOrder } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { usePurchaseOrders, FilterStatus, SortOrder } from '@/hooks/usePurchaseOrders';
import { PurchaseOrderCard } from './PurchaseOrderCard';
import { PurchaseOrderFilters } from './PurchaseOrderFilters';
import { Loader2 } from 'lucide-react';

export function PurchaseOrderList() {
  // State for filters and pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch purchase orders with current filters
  const { 
    purchaseOrders, 
    isLoading, 
    error, 
    totalPages
  } = usePurchaseOrders(sortOrder, currentPage, filterStatus, searchQuery);

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

  // Handle view payments for a purchase order
  const handleViewPayments = (purchaseOrderId: string) => {
    // Implementation will be added later
    console.log('View payments for PO:', purchaseOrderId);
  };

  // Handle export PDF
  const handleExportPdf = (purchaseOrderId: string) => {
    // Implementation will be added later
    console.log('Export PDF for PO:', purchaseOrderId);
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>Manage your purchase orders to vendors</CardDescription>
            </div>
            <Button variant="default">New Purchase Order</Button>
          </div>
        </CardHeader>
        <CardContent>
          <PurchaseOrderFilters 
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
              Error loading purchase orders. Please try again.
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="text-center text-muted-foreground p-6">
              No purchase orders found. Try adjusting your filters or create a new purchase order.
            </div>
          ) : (
            <div className="grid gap-6 mt-6">
              {purchaseOrders.map((po) => (
                <PurchaseOrderCard 
                  key={po.id}
                  purchaseOrder={po}
                  onViewPayments={() => handleViewPayments(po.id)}
                  onExportPdf={() => handleExportPdf(po.id)}
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