
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { ColumnDef, SortOption } from '@/types';

interface SortableColumnProps {
  column: ColumnDef;
  sortOptions: SortOption | null;
  onSort: (columnId: string) => void;
}

export const SortableColumn: React.FC<SortableColumnProps> = ({
  column,
  sortOptions,
  onSort,
}) => {
  const isSortable = column.enableSorting !== false;
  const columnId = column.accessorKey || column.id;
  
  const getSortIcon = () => {
    if (sortOptions?.field !== columnId) return null;
    
    return sortOptions.direction === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  return (
    <TableHead
      className={isSortable ? 'cursor-pointer select-none' : ''}
      onClick={isSortable ? () => onSort(columnId) : undefined}
    >
      <div className="flex items-center">
        {column.header}
        {isSortable && getSortIcon()}
      </div>
    </TableHead>
  );
};
