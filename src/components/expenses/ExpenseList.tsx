/**
 * ExpenseList component displays a list of expenses with filtering options
 * 
 * @module components/expenses
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, FilterX, Filter } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { useExpenses } from '@/hooks/expenses';
import { EXPENSE_CATEGORIES, ExpenseFilters } from '@/types/expenses';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * ExpenseList component displays a list of expenses with filtering options
 */
export const ExpenseList = () => {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    expenses,
    isLoading,
    filters,
    updateFilters,
    clearFilters,
  } = useExpenses();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ searchTerm });
  };

  const handleCategoryChange = (value: string) => {
    updateFilters({ category: value });
  };

  const handleAmountChange = (type: 'min' | 'max', value: string) => {
    if (value === '') {
      const newFilters = { ...filters };
      if (type === 'min') delete newFilters.minAmount;
      else delete newFilters.maxAmount;
      updateFilters(newFilters);
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        updateFilters({ [type === 'min' ? 'minAmount' : 'maxAmount']: numValue });
      }
    }
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    updateFilters({ [type === 'start' ? 'startDate' : 'endDate']: value });
  };

  const hasActiveFilters = !!filters.category || !!filters.minAmount || !!filters.maxAmount || 
                           !!filters.startDate || !!filters.endDate || !!filters.searchTerm;

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="w-full shadow-md">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">Expenses</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                <Input
                  placeholder="Search expenses..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
            </form>
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-1 whitespace-nowrap">
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                      !
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Filter Expenses</SheetTitle>
                  <SheetDescription>
                    Apply filters to narrow down your expense list.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={filters.category || ''}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
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
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount Range</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minAmount || ''}
                        onChange={(e) => handleAmountChange('min', e.target.value)}
                        className="w-1/2"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxAmount || ''}
                        onChange={(e) => handleAmountChange('max', e.target.value)}
                        className="w-1/2"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={filters.startDate || ''}
                        onChange={(e) => handleDateChange('start', e.target.value)}
                        className="w-1/2"
                      />
                      <Input
                        type="date"
                        value={filters.endDate || ''}
                        onChange={(e) => handleDateChange('end', e.target.value)}
                        className="w-1/2"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={clearFilters}>
                      <FilterX className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                    <Button onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button onClick={() => navigate('/expenses/new')} className="gap-1 whitespace-nowrap">
              <PlusCircle className="h-4 w-4" />
              New Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-full h-16 rounded-md" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No expenses found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters 
                  ? "Try clearing some filters or creating your first expense."
                  : "Start by creating your first expense."}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/expenses/new')}
              >
                Create Expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="max-w-[200px]">Category</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow 
                      key={expense.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/expenses/${expense.id}`)}
                    >
                      <TableCell className="font-medium">
                        {expense.formattedDate}
                      </TableCell>
                      <TableCell>
                        {expense.category ? (
                          <Badge variant="outline">{expense.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {expense.notes || 'No notes'}
                      </TableCell>
                      <TableCell className="text-right">
                        {expense.formattedAmount}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/expenses/${expense.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/expenses/${expense.id}/edit`)}>
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {hasActiveFilters && (
          <CardFooter className="flex justify-between border-t px-6 py-3">
            <div className="flex flex-wrap gap-1">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.category && (
                <Badge variant="secondary" className="text-xs">
                  Category: {filters.category}
                </Badge>
              )}
              {(filters.minAmount || filters.maxAmount) && (
                <Badge variant="secondary" className="text-xs">
                  Amount: {filters.minAmount || '0'} - {filters.maxAmount || '∞'}
                </Badge>
              )}
              {(filters.startDate || filters.endDate) && (
                <Badge variant="secondary" className="text-xs">
                  Date: {filters.startDate ? format(new Date(filters.startDate), 'MMM d, yyyy') : 'Any'} - 
                  {filters.endDate ? format(new Date(filters.endDate), 'MMM d, yyyy') : 'Any'}
                </Badge>
              )}
              {filters.searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{filters.searchTerm}"
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7">
              <FilterX className="h-3.5 w-3.5 mr-1" />
              Clear All
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ExpenseList;
