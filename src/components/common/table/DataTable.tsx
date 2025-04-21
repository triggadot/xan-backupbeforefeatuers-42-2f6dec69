
import { useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { ColumnDef, SortOption } from '@/types/base';
import { SortableHeader } from './SortableHeader';
import { TableEmpty } from './TableEmpty';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onSort?: (sort: SortOption) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({ 
  data, 
  columns, 
  onSort, 
  isLoading, 
  emptyMessage 
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortOption | null>(null);

  const handleSort = (field: string) => {
    const direction = sortConfig?.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    const newSort: SortOption = { field, direction };
    setSortConfig(newSort);
    onSort?.(newSort);
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <SortableHeader
              key={column.id}
              column={column}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableEmpty colSpan={columns.length} message={emptyMessage} />
        ) : (
          data.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column.id}>
                  {column.cell 
                    ? column.cell(row)
                    : column.accessorKey 
                      ? String(row[column.accessorKey as keyof T] || '')
                      : null}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
