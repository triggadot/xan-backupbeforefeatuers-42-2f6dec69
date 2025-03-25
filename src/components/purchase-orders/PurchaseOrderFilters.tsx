
import React, { useState, useEffect } from 'react';
import { Calendar, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { PurchaseOrderFilters as FilterOptions } from '@/types/purchaseOrder';
import { format } from 'date-fns';

interface PurchaseOrderFiltersProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

export function PurchaseOrderFilters({ filters, onChange }: PurchaseOrderFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  
  // Update local filters when prop filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters(prev => ({ ...prev, search: e.target.value }));
  };
  
  const handleStatusChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, status: value }));
  };
  
  const handleVendorChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, vendorId: value }));
  };
  
  const handleFromDateChange = (date: Date | undefined) => {
    setLocalFilters(prev => ({ ...prev, fromDate: date }));
  };
  
  const handleToDateChange = (date: Date | undefined) => {
    setLocalFilters(prev => ({ ...prev, toDate: date }));
  };
  
  const handleClearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onChange(clearedFilters);
  };
  
  const handleApplyFilters = () => {
    onChange(localFilters);
  };
  
  const hasActiveFilters = Object.values(localFilters).some(
    value => value !== undefined && value !== '' && value !== null
  );
  
  return (
    <div className="bg-card rounded-lg p-4 border space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by PO number or vendor name"
              className="pl-8"
              value={localFilters.search || ''}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="w-full sm:w-48">
          <Label htmlFor="status">Status</Label>
          <Select
            value={localFilters.status || ''}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-48">
          <Label>From Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {localFilters.fromDate ? (
                  format(localFilters.fromDate, 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={localFilters.fromDate}
                onSelect={handleFromDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="w-full sm:w-48">
          <Label>To Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {localFilters.toDate ? (
                  format(localFilters.toDate, 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={localFilters.toDate}
                onSelect={handleToDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex items-end space-x-2 mt-auto">
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
