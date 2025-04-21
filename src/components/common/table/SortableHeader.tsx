
import React from 'react';
import { TableHead } from '@/components/ui/table';
import { ColumnDef, SortOption } from '@/types/base';

interface SortableHeaderProps<T> {
  column: ColumnDef<T>;
  sortConfig: SortOption | null;
  onSort: (columnId: string) => void;
}

export function SortableHeader<T>({ 
  column, 
  sortConfig, 
  onSort 
}: SortableHeaderProps<T>) {
  const isSorted = sortConfig?.field === column.id;
  const sortDirection = isSorted ? sortConfig.direction : null;

  return (
    <TableHead
      className={column.enableSorting ? "cursor-pointer hover:bg-muted/50" : ""}
      onClick={() => column.enableSorting && onSort(column.id)}
    >
      <div className="flex items-center justify-between">
        <span>{column.header}</span>
        {isSorted && (
          <span className="ml-2">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </TableHead>
  );
}
