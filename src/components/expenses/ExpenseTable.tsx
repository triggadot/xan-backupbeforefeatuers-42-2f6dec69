
import React from 'react';
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
import { Plus } from 'lucide-react';
import { Expense, ExpenseFilters } from '@/types/expenses';

// Import refactored components
import ExpenseFilterBar from './filters/ExpenseFilters';
import ExpenseRow from './table/ExpenseRow';
import ExpenseEmptyState from './table/ExpenseEmptyState';
import ExpenseTableSkeleton from './table/ExpenseTableSkeleton';

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
        <ExpenseFilterBar
          filters={filters}
          updateFilters={updateFilters}
          clearFilters={clearFilters}
        />

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
                  <ExpenseTableSkeleton />
                ) : expenses.length === 0 ? (
                  <ExpenseEmptyState 
                    hasFilters={Object.keys(filters).length > 0} 
                    clearFilters={clearFilters}
                  />
                ) : (
                  expenses.map((expense) => (
                    <ExpenseRow 
                      key={expense.id}
                      expense={expense}
                      onEditExpense={onEditExpense}
                      onDeleteExpense={onDeleteExpense}
                    />
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
