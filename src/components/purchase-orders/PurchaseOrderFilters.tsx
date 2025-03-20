
import React, { useState, useEffect } from 'react';
import { Search, CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccountsNew } from '@/hooks/useAccountsNew';
import { useDebounce } from 'use-debounce';
import type { PurchaseOrderFilters as FilterType } from '@/types/purchaseOrder';

interface PurchaseOrderFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

const PurchaseOrderFilters: React.FC<PurchaseOrderFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const { accounts } = useAccountsNew();
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [debouncedSearch] = useDebounce(searchValue, 500);

  useEffect(() => {
    onFiltersChange({
      ...filters,
      search: debouncedSearch || undefined
    });
  }, [debouncedSearch, filters, onFiltersChange]);

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({
        ...filters,
        status: undefined
      });
    } else {
      onFiltersChange({
        ...filters,
        status: value as any
      });
    }
  };

  const handleVendorChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({
        ...filters,
        accountId: undefined
      });
    } else {
      onFiltersChange({
        ...filters,
        accountId: value
      });
    }
  };

  const handleDateFromChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateFrom: date
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateTo: date
    });
  };

  const activeFilterCount = [
    filters.status,
    filters.accountId,
    filters.dateFrom,
    filters.dateTo
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search purchase orders..."
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

        <Select
          value={filters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.accountId || 'all'}
          onValueChange={handleVendorChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Vendor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {accounts.filter(account => 
              account.is_vendor
            ).map(account => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-10">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom ? (
                <>
                  {format(filters.dateFrom, 'LLL dd, y')}
                  {filters.dateTo && ` - ${format(filters.dateTo, 'LLL dd, y')}`}
                </>
              ) : "Date Range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-4 flex flex-col space-y-4">
              <h4 className="font-medium text-sm">Filter by date</h4>
              <div className="grid gap-2">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground">From</span>
                  <Calendar
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
                  <Calendar
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
                <Button size="sm">
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

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

export default PurchaseOrderFilters;
