
import React from 'react';
import { TableHead } from '@/components/ui/table';
import { ColumnDef, SortOption } from '@/types/base';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableColumnProps {
  column: ColumnDef<any>;
  sortOptions: SortOption | null;
  onSort: (columnId: string) => void;
}

export function SortableColumn({ 
  column, 
  sortOptions, 
  onSort 
}: SortableColumnProps) {
  const isSorted = sortOptions?.field === column.id;
  const sortDirection = isSorted ? sortOptions.direction : null;

  return (
    <TableHead
      className={cn(
        "whitespace-nowrap",
        column.enableSorting ? "cursor-pointer hover:bg-muted/50" : ""
      )}
      onClick={() => column.enableSorting && onSort(column.id)}
    >
      <div className="flex items-center justify-between">
        <span>{column.header}</span>
        {isSorted && (
          <span className="ml-2">
            {sortDirection === 'asc' ? 
              <ArrowUp className="h-4 w-4" /> : 
              <ArrowDown className="h-4 w-4" />
            }
          </span>
        )}
      </div>
    </TableHead>
  );
}
