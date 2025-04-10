import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@tremor/react';
import { UnpaidInventoryItem } from '@/hooks/products/useUnpaidInventory';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/format';
import { Search, ArrowUpDown } from 'lucide-react';
import { Product } from '@/types/products';

interface UnpaidInventoryListProps {
  items: UnpaidInventoryItem[];
  onSelectProduct: (product: Product) => void;
}

/**
 * UnpaidInventoryList component
 * 
 * Displays a table of unpaid inventory items with search and sort functionality
 */
export const UnpaidInventoryList: React.FC<UnpaidInventoryListProps> = ({ 
  items, 
  onSelectProduct 
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<keyof UnpaidInventoryItem>('remaining_balance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Handle sort toggling
  const handleSort = (field: keyof UnpaidInventoryItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort the items
  const filteredItems = items
    .filter(item => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        (item.display_name?.toLowerCase().includes(searchLower)) ||
        (item.vendor_name?.toLowerCase().includes(searchLower)) ||
        (item.category?.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

  return (
    <div>
      <div className="mb-4 relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search products or vendors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="cursor-pointer" onClick={() => handleSort('display_name')}>
                <div className="flex items-center gap-1">
                  Product
                  {sortField === 'display_name' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHeaderCell>
              <TableHeaderCell className="cursor-pointer" onClick={() => handleSort('vendor_name')}>
                <div className="flex items-center gap-1">
                  Vendor
                  {sortField === 'vendor_name' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHeaderCell>
              <TableHeaderCell className="cursor-pointer" onClick={() => handleSort('category')}>
                <div className="flex items-center gap-1">
                  Category
                  {sortField === 'category' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHeaderCell>
              <TableHeaderCell className="cursor-pointer" onClick={() => handleSort('total_qty_purchased')}>
                <div className="flex items-center gap-1">
                  Quantity
                  {sortField === 'total_qty_purchased' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHeaderCell>
              <TableHeaderCell className="cursor-pointer" onClick={() => handleSort('cost')}>
                <div className="flex items-center gap-1">
                  Unit Cost
                  {sortField === 'cost' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHeaderCell>
              <TableHeaderCell className="cursor-pointer" onClick={() => handleSort('total_cost')}>
                <div className="flex items-center gap-1">
                  Total Cost
                  {sortField === 'total_cost' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHeaderCell>
              <TableHeaderCell className="cursor-pointer" onClick={() => handleSort('remaining_balance')}>
                <div className="flex items-center gap-1">
                  Remaining
                  {sortField === 'remaining_balance' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHeaderCell>
              <TableHeaderCell className="cursor-pointer" onClick={() => handleSort('payment_status')}>
                <div className="flex items-center gap-1">
                  Status
                  {sortField === 'payment_status' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No unpaid inventory items found
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.display_name}</TableCell>
                  <TableCell>{item.vendor_name}</TableCell>
                  <TableCell>{item.category || 'Uncategorized'}</TableCell>
                  <TableCell>{item.total_qty_purchased}</TableCell>
                  <TableCell>{item.formattedCost}</TableCell>
                  <TableCell>{item.formattedTotalCost}</TableCell>
                  <TableCell>{item.formattedRemainingBalance}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.payment_status === 'unpaid' ? 'destructive' : 'warning'}
                    >
                      {item.payment_status === 'unpaid' ? 'Unpaid' : 'Partial'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onSelectProduct(item)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
