
import React from 'react';
import { TableHead, TableHeader as UITableHeader, TableRow } from '@/components/ui/table';
import { ColumnDef, SortOption } from '@/types/base';
import { SortableColumn } from './SortableColumn';

interface TableHeaderProps<T> {
  columns: ColumnDef<T>[];
  sortOptions: SortOption | null;
  onSort: (columnId: string) => void;
  hasRowActions: boolean;
}

export function TableHeader<T>({
  columns,
  sortOptions,
  onSort,
  hasRowActions,
}: TableHeaderProps<T>) {
  return (
    <UITableHeader>
      <TableRow>
        {columns.map((column) => (
          <SortableColumn
            key={column.id}
            column={column}
            sortOptions={sortOptions}
            onSort={onSort}
          />
        ))}
        {hasRowActions && <TableHead className="w-[100px]">Actions</TableHead>}
      </TableRow>
    </UITableHeader>
  );
}
