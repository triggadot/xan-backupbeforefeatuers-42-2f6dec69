
import React, { useState, useMemo } from 'react';
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnDef, SortOption } from '@/types/common/common';

export interface EntityTableProps<T> {
  title: string;
  data: T[];
  columns: ColumnDef[];
  isLoading?: boolean;
  error?: string | null;
  onRowClick?: (row: T) => void;
  onCreateClick?: () => void;
  createButtonLabel?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
}

export function EntityTable<T extends { id: string }>({
  title,
  data,
  columns,
  isLoading = false,
  error = null,
  onRowClick,
  onCreateClick,
  createButtonLabel = 'Create New',
  emptyMessage = 'No items found.',
  searchPlaceholder = 'Search...'
}: EntityTableProps<T>) {
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
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <Skeleton className="h-10 w-[150px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/10 p-4 text-destructive">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        {onCreateClick && (
          <Button onClick={onCreateClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {createButtonLabel}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead 
                      key={column.id}
                      className={column.sortable !== false ? 'cursor-pointer' : ''}
                      onClick={column.sortable !== false ? () => handleSort(column.id) : undefined}
                    >
                      <div className="flex items-center">
                        {column.header}
                        {sortOptions?.field === column.id && (
                          <span className="ml-1">
                            {sortOptions.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {emptyMessage}
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
}
