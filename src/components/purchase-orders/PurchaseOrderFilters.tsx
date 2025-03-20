import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { CalendarIcon, Search, X } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from "@/lib/utils"
import { useAccountsNew } from '@/hooks/useAccountsNew';

interface DateRange {
  from?: Date;
  to?: Date;
}

export function PurchaseOrderFilters() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [date, setDate] = useState<DateRange | null>(null);
  const { accounts, isLoading: isLoadingAccounts } = useAccountsNew();

  useEffect(() => {
    // Apply filters here (e.g., call an API with the filter values)
    console.log("Search:", debouncedSearch);
    console.log("Status:", selectedStatus);
    console.log("Vendor:", selectedVendor);
    console.log("Date Range:", date);
  }, [debouncedSearch, selectedStatus, selectedVendor, date]);

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value === "all" ? null : value);
  };

  const handleVendorChange = (value: string) => {
    setSelectedVendor(value === "all" ? null : value);
  };

  const handleDateChange = (date: DateRange | null) => {
    setDate(date);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedStatus(null);
    setSelectedVendor(null);
    setDate(null);
  };

  const activeFilters = [
    search,
    selectedStatus,
    selectedVendor,
    date?.from,
    date?.to,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search purchase orders..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => setSearch("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Status Filter */}
        <Select onValueChange={handleStatusChange} defaultValue={selectedStatus || 'all'}>
          <SelectTrigger className="min-w-[150px]">
            <SelectValue placeholder="All Statuses" />
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

        {/* Vendor Filter */}
        <Select
          value={selectedVendor || 'all'}
          onValueChange={handleVendorChange}
        >
          <SelectTrigger className="min-w-[180px]">
            <SelectValue placeholder="All Vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {accounts
              .filter(account => account.is_vendor)
              .map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={{ from: date?.from, to: date?.to }}
              onSelect={date => setDate({ from: date?.from, to: date?.to })}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {activeFilters > 0 && (
        <div className="mt-2">
          <Button variant="link" size="sm" onClick={clearFilters}>
            Clear filters ({activeFilters})
          </Button>
        </div>
      )}
    </div>
  );
}
