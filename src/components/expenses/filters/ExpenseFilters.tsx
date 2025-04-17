
import React, { useState } from 'react';
import { Filter, Calendar, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExpenseFilters } from '@/types/expenses';
import { EXPENSE_CATEGORIES } from '@/types/expenses';

interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  updateFilters: (filters: Partial<ExpenseFilters>) => void;
  clearFilters: () => void;
}

export const ExpenseFilterBar = ({ filters, updateFilters, clearFilters }: ExpenseFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = () => {
    updateFilters({ searchTerm });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="mb-4 space-y-4">
      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search expenses..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <Select
          value={filters.category || ''}
          onValueChange={(value) => updateFilters({ category: value || undefined })}
        >
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {EXPENSE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => clearFilters()}
            >
              Clear filters
            </DropdownMenuItem>
            {/* Add more filter options as needed */}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="outline" className="ml-auto">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
      
      {/* Active Filters Display */}
      {(filters.category || filters.startDate || filters.endDate || filters.minAmount || filters.maxAmount) && (
        <ActiveFilters filters={filters} updateFilters={updateFilters} clearFilters={clearFilters} />
      )}
    </div>
  );
};

interface ActiveFiltersProps {
  filters: ExpenseFilters;
  updateFilters: (filters: Partial<ExpenseFilters>) => void;
  clearFilters: () => void;
}

const ActiveFilters = ({ filters, updateFilters, clearFilters }: ActiveFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
      {filters.category && (
        <Badge variant="secondary" className="flex items-center gap-1">
          Category: {filters.category}
          <button
            onClick={() => updateFilters({ category: undefined })}
            className="ml-1 rounded-full hover:bg-accent"
          >
            ×
          </button>
        </Badge>
      )}
      {filters.startDate && (
        <Badge variant="secondary" className="flex items-center gap-1">
          From: {new Date(filters.startDate).toLocaleDateString()}
          <button
            onClick={() => updateFilters({ startDate: undefined })}
            className="ml-1 rounded-full hover:bg-accent"
          >
            ×
          </button>
        </Badge>
      )}
      {filters.endDate && (
        <Badge variant="secondary" className="flex items-center gap-1">
          To: {new Date(filters.endDate).toLocaleDateString()}
          <button
            onClick={() => updateFilters({ endDate: undefined })}
            className="ml-1 rounded-full hover:bg-accent"
          >
            ×
          </button>
        </Badge>
      )}
      {(filters.minAmount || filters.maxAmount) && (
        <Badge variant="secondary" className="flex items-center gap-1">
          Amount: {filters.minAmount ? `$${filters.minAmount}` : '$0'} - {filters.maxAmount ? `$${filters.maxAmount}` : '∞'}
          <button
            onClick={() => updateFilters({ minAmount: undefined, maxAmount: undefined })}
            className="ml-1 rounded-full hover:bg-accent"
          >
            ×
          </button>
        </Badge>
      )}
      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs">
        Clear all
      </Button>
    </div>
  );
};

export default ExpenseFilterBar;
