
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from '@/components/ui/button';
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils"
import { format } from 'date-fns';
import { useAccountsNew } from '@/hooks/useAccountsNew';

interface PurchaseOrderFiltersProps {
  onFiltersChange: (filters: { search?: string; vendorId?: string; dateFrom?: Date | null; dateTo?: Date | null }) => void;
}

const PurchaseOrderFilters: React.FC<PurchaseOrderFiltersProps> = ({ onFiltersChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<{ search?: string; vendorId?: string; dateFrom?: Date | null; dateTo?: Date | null }>({
    search: searchParams.get('search') || '',
    vendorId: searchParams.get('vendorId') || '',
    dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom') as string) : null,
    dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo') as string) : null,
  });
  const [date, setDate] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: filters.dateFrom || undefined,
    to: filters.dateTo || undefined,
  });
  const { accounts } = useAccountsNew();

  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      vendorId: searchParams.get('vendorId') || '',
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom') as string) : null,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo') as string) : null,
    });
    setDate({
      from: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom') as string) : undefined,
      to: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo') as string) : undefined,
    })
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.vendorId) params.set('vendorId', filters.vendorId);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo) params.set('dateTo', filters.dateTo.toISOString());
    setSearchParams(params);

    onFiltersChange(filters);
  }, [filters, onFiltersChange, setSearchParams]);

  const handleFilterChange = (key: string, value: string | Date | null) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const handleDateChange = (newDate: { from?: Date; to?: Date; } | undefined) => {
    if (newDate) {
      setDate(newDate);
      handleFilterChange('dateFrom', newDate.from || null);
      handleFilterChange('dateTo', newDate.to || null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <Label htmlFor="search">Search</Label>
        <Input
          type="text"
          id="search"
          placeholder="Search by PO number"
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="vendor">Vendor</Label>
        
<Select 
  value={filters.vendorId || ''}
  onValueChange={(value) => handleFilterChange('vendorId', value)}
>
  <SelectTrigger>
    <SelectValue placeholder="All vendors" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">All vendors</SelectItem>
    {accounts
      .filter(account => account.is_vendor)
      .map((account) => (
        <SelectItem key={account.id} value={account.id}>
          {account.name}
        </SelectItem>
      ))}
  </SelectContent>
</Select>
      </div>

      <div>
        <Label>Date Range</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  `${format(date.from, "MMM dd, yyyy")} - ${format(date.to, "MMM dd, yyyy")}`
                ) : (
                  format(date.from, "MMM dd, yyyy")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center" side="bottom">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default PurchaseOrderFilters;
