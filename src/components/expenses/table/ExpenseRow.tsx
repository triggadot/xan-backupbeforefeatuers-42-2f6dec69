
import React from 'react';
import { Calendar, SlidersHorizontal } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Expense } from '@/types/expenses';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExpenseRowProps {
  expense: Expense;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expense: Expense) => void;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({ 
  expense, 
  onEditExpense, 
  onDeleteExpense 
}) => {
  return (
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
        {expense.formattedAmount || new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(expense.amount || 0)}
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
  );
};

export default ExpenseRow;
