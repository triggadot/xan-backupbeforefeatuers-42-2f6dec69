import { useEffect, useState } from 'react';
import { Search, SortAsc, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterStatus, SortOrder } from '@/hooks/usePurchaseOrders';

interface PurchaseOrderFiltersProps {
  onFilterChange: (status: FilterStatus) => void;
  onSortChange: (order: SortOrder) => void;
  onSearch: (query: string) => void;
  currentFilter: FilterStatus;
  currentSort: SortOrder;
  searchQuery: string;
}

export function PurchaseOrderFilters({
  onFilterChange,
  onSortChange,
  onSearch,
  currentFilter,
  currentSort,
  searchQuery
}: PurchaseOrderFiltersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  
  // Update local state if props change (e.g. reset)
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Handle search input
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearchQuery);
  };

  // Handle filter selection
  const handleFilterSelect = (value: string) => {
    onFilterChange(value as FilterStatus);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    onSortChange(currentSort === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search purchase orders..."
            className="pl-8 w-full"
            value={localSearchQuery}
            onChange={handleSearchInput}
          />
          <Button type="submit" className="sr-only">Search</Button>
        </form>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSortOrder}
          className="hidden sm:flex"
        >
          {currentSort === 'asc' ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
          <span className="sr-only">
            Sort {currentSort === 'asc' ? 'Ascending' : 'Descending'}
          </span>
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <Tabs 
          defaultValue={currentFilter} 
          value={currentFilter}
          onValueChange={handleFilterSelect}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full sm:w-auto grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            <TabsTrigger value="partial">Partial</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSortOrder}
          className="sm:hidden"
        >
          {currentSort === 'asc' ? 'Oldest First' : 'Newest First'}
        </Button>
      </div>
    </div>
  );
} 