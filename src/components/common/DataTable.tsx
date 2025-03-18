
import React, { useState, useMemo } from 'react';
import {
  Table, 
  TableBody, 
  TableCell, 
  TableRow 
} from '@/components/ui/table';
import { ColumnDef, SortOption } from '@/types';
import { TableHeader } from './table/TableHeader';
import { TableActions } from './table/TableActions';
import { TableToolbar } from './table/TableToolbar';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef[];
  title: string;
  searchPlaceholder?: string;
  createButtonLabel?: string;
  onCreateClick?: () => void;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

function DataTable<T extends { id: string }>({
  data,
  columns,
  title,
  searchPlaceholder = 'Search...',
  createButtonLabel = 'Create New',
  onCreateClick,
  onRowClick,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOptions, setSortOptions] = useState<SortOption | null>(null);
  
  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return Object.values(item).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (typeof value === 'number') {
          return String(value).includes(searchTerm);
        }
        return false;
      });
    });
  }, [data, searchTerm]);
  
  // Sort data based on sort options
  const sortedData = useMemo(() => {
    if (!sortOptions) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortOptions.field as keyof T];
      const bValue = b[sortOptions.field as keyof T];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOptions.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOptions.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOptions.direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      return 0;
    });
  }, [filteredData, sortOptions]);
  
  const handleSort = (columnId: string) => {
    if (sortOptions?.field === columnId) {
      if (sortOptions.direction === 'asc') {
        setSortOptions({ field: columnId, direction: 'desc' });
      } else {
        setSortOptions(null);
      }
    } else {
      setSortOptions({ field: columnId, direction: 'asc' });
    }
  };
  
  return (
    <div className="animate-enter-bottom">
      <TableToolbar
        title={title}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={searchPlaceholder}
        createButtonLabel={createButtonLabel}
        onCreateClick={onCreateClick}
      />
      
      <div className="rounded-lg border bg-card overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader
              columns={columns}
              sortOptions={sortOptions}
              onSort={handleSort}
              hasRowActions={Boolean(onEdit || onDelete)}
            />
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((row) => (
                  <TableRow 
                    key={row.id} 
                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((column) => (
                      <TableCell key={`${row.id}-${column.id}`}>
                        {column.cell 
                          ? column.cell(row) 
                          : column.accessorKey 
                            ? String(row[column.accessorKey as keyof T] ?? '')
                            : ''}
                      </TableCell>
                    ))}
                    
                    {(onEdit || onDelete) && (
                      <TableCell className="text-right">
                        <TableActions
                          row={row}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
