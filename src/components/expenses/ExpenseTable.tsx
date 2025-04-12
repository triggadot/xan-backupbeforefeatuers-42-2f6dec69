
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Download,
  Filter,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Expense, EXPENSE_CATEGORIES, ExpenseFilters } from '@/types/expenses';
import { formatCurrency } from '@/lib/utils';

interface ExpenseTableProps {
  expenses: Expense[];
  isLoading: boolean;
  error: Error | null;
  filters: ExpenseFilters;
  updateFilters: (filters: Partial<ExpenseFilters>) => void;
  clearFilters: () => void;
  onCreateExpense?: () => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expense: Expense) => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  isLoading,
  error,
  filters,
  updateFilters,
  clearFilters,
  onCreateExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = () => {
    updateFilters({ searchTerm });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader className="pb-2">
          <CardTitle>Error Loading Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Expenses</CardTitle>
        <Button onClick={onCreateExpense} className="hover-lift">
          <Plus className="mr-2 h-4 w-4" />
          New Expense
        </Button>
      </CardHeader>
      <CardContent>
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
                  className="flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
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
          )}
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Receipt className="h-8 w-8" />
                        <p>No expenses found</p>
                        {Object.keys(filters).length > 0 && (
                          <Button variant="link" onClick={clearFilters} className="h-auto p-0">
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{expense.formattedDate || new Date(expense.date || '').toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell>{expense.expense_supplier_name || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">{expense.notes || 'No description'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {expense.formattedAmount || formatCurrency(expense.amount || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <SlidersHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => onEditExpense && onEditExpense(expense)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDeleteExpense && onDeleteExpense(expense)}
                                className="text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseTable;
