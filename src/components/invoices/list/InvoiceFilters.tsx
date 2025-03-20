
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { X, Search, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { InvoiceFilters } from '@/types/invoice';
import { useAccounts } from '@/hooks/useAccounts';

interface InvoiceFilterBarProps {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
}

export const InvoiceFilterBar = ({
  filters,
  onFiltersChange,
}: InvoiceFilterBarProps) => {
  const { accounts } = useAccounts();
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [debouncedSearch] = useDebounce(searchValue, 500);

  // Update the search filter when debounced value changes
  useEffect(() => {
    onFiltersChange({ ...filters, search: debouncedSearch || undefined });
  }, [debouncedSearch, filters, onFiltersChange]);

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({ ...filters, status: undefined });
    } else {
      onFiltersChange({ ...filters, status: [value] });
    }
  };

  // Handle customer filter change
  const handleCustomerChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({ ...filters, customerId: undefined });
    } else {
      onFiltersChange({ ...filters, customerId: value });
    }
  };

  // Handle date from change
  const handleDateFromChange = (date: Date | undefined) => {
    onFiltersChange({ ...filters, dateFrom: date });
  };

  // Handle date to change
  const handleDateToChange = (date: Date | undefined) => {
    onFiltersChange({ ...filters, dateTo: date });
  };

  // Count active filters excluding search
  const activeFilterCount = [
    filters.status,
    filters.customerId,
    filters.dateFrom,
    filters.dateTo
  ].filter(Boolean).length;

  // Reset all filters
  const resetFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchValue('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <Select 
          value={filters.status?.[0] || 'all'} 
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        {/* Customer Filter */}
        <Select 
          value={filters.customerId || 'all'} 
          onValueChange={handleCustomerChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {accounts
              .filter(account => account.type === 'customer' || account.type === 'both')
              .map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-10">
              <Calendar className="mr-2 h-4 w-4" />
              {filters.dateFrom ? (
                <>
                  {format(filters.dateFrom, 'LLL dd, y')}
                  {filters.dateTo && ` - ${format(filters.dateTo, 'LLL dd, y')}`}
                </>
              ) : (
                "Date Range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-4 flex flex-col space-y-4">
              <h4 className="font-medium text-sm">Filter by date</h4>
              <div className="grid gap-2">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground">From</span>
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={handleDateFromChange}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground">To</span>
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={handleDateToChange}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    handleDateFromChange(undefined);
                    handleDateToChange(undefined);
                  }}
                >
                  Reset
                </Button>
                <Button size="sm">Apply</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset Filters */}
        {(activeFilterCount > 0 || searchValue) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            className="h-10"
          >
            <X className="mr-2 h-4 w-4" />
            Reset
            {activeFilterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
