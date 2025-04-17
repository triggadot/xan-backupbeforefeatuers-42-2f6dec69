
import React from 'react';
import { Receipt } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface ExpenseEmptyStateProps {
  hasFilters: boolean;
  clearFilters: () => void;
}

export const ExpenseEmptyState: React.FC<ExpenseEmptyStateProps> = ({ 
  hasFilters, 
  clearFilters 
}) => {
  return (
    <TableRow>
      <TableCell colSpan={6} className="h-24 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Receipt className="h-8 w-8" />
          <p>No expenses found</p>
          {hasFilters && (
            <Button variant="link" onClick={clearFilters} className="h-auto p-0">
              Clear filters
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ExpenseEmptyState;
