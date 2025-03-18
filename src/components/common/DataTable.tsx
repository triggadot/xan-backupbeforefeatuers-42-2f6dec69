
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, MoreVertical, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ColumnDef, SortOption } from '@/types';

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
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return Object.values(item).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchTerm);
        }
        return false;
      });
    });
  }, [data, searchTerm]);
  
  // Sort data based on sort options
  const sortedData = React.useMemo(() => {
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
  
  const getSortIcon = (columnId: string) => {
    if (sortOptions?.field !== columnId) return null;
    
    return sortOptions.direction === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };
  
  return (
    <div className="animate-enter-bottom">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {onCreateClick && (
            <Button onClick={onCreateClick} className="hover-lift">
              {createButtonLabel}
            </Button>
          )}
        </div>
      </div>
      
      <div className="rounded-lg border bg-card overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={column.enableSorting !== false ? 'cursor-pointer select-none' : ''}
                    onClick={column.enableSorting !== false ? () => handleSort(column.accessorKey || column.id) : undefined}
                  >
                    <div className="flex items-center">
                      {column.header}
                      {column.enableSorting !== false && getSortIcon(column.accessorKey || column.id)}
                    </div>
                  </TableHead>
                ))}
                {(onEdit || onDelete) && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEdit && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onEdit(row);
                              }}>
                                Edit
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(row);
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
