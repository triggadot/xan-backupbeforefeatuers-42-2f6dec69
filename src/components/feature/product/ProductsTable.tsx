import React, { useState, useMemo, useRef } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatCurrency } from '@/utils/format-utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Button 
} from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ColumnDef,
  FilterFn,
  PaginationState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Columns3,
  Ellipsis,
  ListFilter,
  CircleX,
  Tag,
  Info,
  DollarSign,
  Package,
  User,
  Trash
} from 'lucide-react';

interface ProductsTableProps {
  products: any[];
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  onViewDetails?: (product: any) => void;
}

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  const searchableRowContent = [
    row.original.display_name,
    row.original.new_product_name,
    row.original.vendor_product_name,
    row.original.category
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

function ProductsTable({ products, onEdit, onDelete, onViewDetails }: ProductsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "display_name",
      desc: false,
    },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 28,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "productName",
      header: "Product Name",
      accessorFn: (row) => row.display_name || row.new_product_name || row.vendor_product_name || 'Unnamed Product',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue("productName")}
        </div>
      ),
      size: 200,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: ({ row }) => row.getValue("category") || "—",
      size: 150,
    },
    {
      header: "Cost",
      accessorKey: "cost",
      cell: ({ row }) => {
        const cost = row.getValue("cost");
        return cost ? formatCurrency(cost as number) : "—";
      },
      size: 100,
    },
    {
      header: "Quantity",
      accessorKey: "total_qty_purchased",
      cell: ({ row }) => {
        const qty = row.getValue("total_qty_purchased");
        return qty !== null && qty !== undefined ? qty : "—";
      },
      size: 100,
    },
    {
      header: "Total Value",
      id: "totalValue",
      accessorFn: (row) => {
        if (row.cost && row.total_qty_purchased) {
          return row.cost * row.total_qty_purchased;
        }
        return null;
      },
      cell: ({ row }) => {
        const value = row.getValue("totalValue");
        return value ? formatCurrency(value as number) : "—";
      },
      size: 120,
    },
    {
      header: "Vendor",
      accessorKey: "rowid_accounts",
      cell: ({ row }) => {
        const vendorId = row.getValue("rowid_accounts");
        return vendorId ? <VendorName vendorId={vendorId as string} /> : "—";
      },
      size: 180,
    },
    {
      header: "Status",
      id: "status",
      accessorFn: (row) => {
        const statuses = [];
        if (row.samples) statuses.push("Sample");
        if (row.fronted) statuses.push("Fronted");
        if (row.miscellaneous_items) statuses.push("Misc");
        return statuses;
      },
      cell: ({ row }) => {
        const statuses = row.getValue("status") as string[];
        if (!statuses.length) return null;
        
        return (
          <div className="flex flex-col gap-1">
            {statuses.map((status) => (
              <Badge key={status} variant="outline" className={
                status === "Sample" ? "bg-blue-50" :
                status === "Fronted" ? "bg-amber-50" :
                "bg-purple-50"
              }>
                {status}
              </Badge>
            ))}
          </div>
        );
      },
      size: 120,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <RowActions row={row} onEdit={onEdit} onDelete={onDelete} />,
      size: 60,
      enableHiding: false,
    },
  ], [onEdit, onDelete]);

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      pagination,
      columnVisibility,
    },
    enableSortingRemoval: false,
  });

  if (products.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No products found. Create your first product by clicking "New Product" button above.</p>
      </Card>
    );
  }

  const handleDeleteSelected = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    
    const confirmMessage = selectedRows.length === 1 
      ? `Are you sure you want to delete ${selectedRows[0].original.display_name || 'this product'}?`
      : `Are you sure you want to delete ${selectedRows.length} selected products?`;
    
    if (confirm(confirmMessage)) {
      selectedRows.forEach(row => {
        onDelete(row.original);
      });
      table.resetRowSelection();
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Filter by name, vendor name, or category */}
          <div className="relative">
            <Input
              ref={inputRef}
              className="peer min-w-60 ps-9"
              value={(table.getColumn("productName")?.getFilterValue() ?? "") as string}
              onChange={(e) => table.getColumn("productName")?.setFilterValue(e.target.value)}
              placeholder="Filter products..."
              type="text"
              aria-label="Filter products"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn("productName")?.getFilterValue()) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn("productName")?.setFilterValue("");
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <CircleX size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Toggle columns visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns3
                  className="-ms-1 me-2 opacity-60"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                View Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.id === "productName" ? "Product Name" :
                       column.id === "totalValue" ? "Total Value" :
                       column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          {/* Delete button */}
          {table.getSelectedRowModel().rows.length > 0 && (
            <Button className="ml-auto" variant="outline" onClick={handleDeleteSelected}>
              <Trash
                className="-ms-1 me-2 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Delete
              <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                {table.getSelectedRowModel().rows.length}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className="h-11"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={header.column.getCanSort() &&
                            "flex h-full cursor-pointer select-none items-center justify-between gap-2"}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (
                              header.column.getCanSort() &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e);
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: (
                              <ChevronUp
                                className="shrink-0 opacity-60"
                                size={16}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                            ),
                            desc: (
                              <ChevronDown
                                className="shrink-0 opacity-60"
                                size={16}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                            ),
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow 
                  key={row.id} 
                  data-state={row.getIsSelected() && "selected"}
                  className={onViewDetails ? "cursor-pointer" : ""}
                  onClick={onViewDetails ? () => onViewDetails(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="last:py-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-8">
        {/* Results per page */}
        <div className="flex items-center gap-3">
          <label htmlFor="page-size" className="max-sm:sr-only">
            Rows per page
          </label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger id="page-size" className="w-fit whitespace-nowrap">
              <SelectValue placeholder="Select number of results" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Page number information */}
        <div className="flex grow justify-end whitespace-nowrap text-sm text-muted-foreground">
          <p className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
            <span className="text-foreground">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
              {Math.min(
                Math.max(
                  table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                    table.getState().pagination.pageSize,
                  0,
                ),
                table.getRowCount(),
              )}
            </span>{" "}
            of <span className="text-foreground">{table.getRowCount().toString()}</span>
          </p>
        </div>

        {/* Pagination buttons */}
        <Pagination>
          <PaginationContent>
            {/* First page button */}
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.firstPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to first page"
              >
                <ChevronFirst size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
            </PaginationItem>
            {/* Previous page button */}
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
            </PaginationItem>
            {/* Next page button */}
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
              >
                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
            </PaginationItem>
            {/* Last page button */}
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.lastPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to last page"
              >
                <ChevronLast size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

function RowActions({ row, onEdit, onDelete }: { row: Row<any>, onEdit: (product: any) => void, onDelete: (product: any) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-end">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 p-0 shadow-none" 
            onClick={(e) => e.stopPropagation()}
            aria-label="Open menu"
          >
            <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onEdit(row.original)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(row.original)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper component to display vendor name
const VendorName: React.FC<{ vendorId: string }> = ({ vendorId }) => {
  const [vendorName, setVendorName] = React.useState<string>('Loading...');
  
  React.useEffect(() => {
    async function fetchVendorName() {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase
          .from('gl_accounts')
          .select('account_name')
          .eq('glide_row_id', vendorId)
          .single();
          
        if (error) throw error;
        setVendorName(data?.account_name || 'Unknown Vendor');
      } catch (error) {
        console.error('Error fetching vendor name:', error);
        setVendorName('Unknown Vendor');
      }
    }
    
    fetchVendorName();
  }, [vendorId]);
  
  return <span>{vendorName}</span>;
};

export default ProductsTable;
