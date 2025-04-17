import { useState, useMemo } from "react";
import { useTableData } from "@/hooks/gl-sync";
import { TableName } from "@/types/glide-sync/glsync.unified";
import { TABLE_INFO } from "./utils/syncUtils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronFirst, 
  ChevronLast,
  PlusCircle,
  RefreshCw,
  Edit as PencilIcon,
  Columns3
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  VisibilityState
} from "@tanstack/react-table";
import TableRecordDialog from "@/components/data-management/TableRecordDialog";

interface SyncDetailTableProps {
  tableName: TableName;
  displayName: string;
  description?: string;
  initialFilter?: Record<string, any>;
  readOnly?: boolean;
}

export function SyncDetailTable({ 
  tableName, 
  displayName, 
  description,
  initialFilter = {},
  readOnly = false
}: SyncDetailTableProps) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Record<string, unknown> | null>(null);

  // Fetch data using the same hook as SupabaseTableView
  const { 
    data, 
    isLoading, 
    error, 
    fetchData, 
    createRecord, 
    updateRecord, 
    deleteRecord 
  } = useTableData(tableName);

  // Define columns based on the first record
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const firstRecord = data[0];
    const cols: ColumnDef<any>[] = Object.keys(firstRecord)
      .filter(key => key !== "id" && key !== "created_at" && key !== "updated_at")
      .map(key => ({
        id: key,
        accessorKey: key,
        header: key
          .split("_")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        cell: ({ row }) => renderCellValue(row.getValue(key), key)
      }));
    
    // Add actions column if not read-only
    if (!readOnly) {
      cols.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCurrentRecord(row.original);
                setIsEditDialogOpen(true);
              }}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      });
    }
    
    return cols;
  }, [data, readOnly]);

  // Create table instance
  const table = useReactTable({
    data: data || [],
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // CRUD handlers
  const handleCreate = (values: Record<string, unknown>) => {
    createRecord(values);
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = (values: Record<string, unknown>) => {
    if (currentRecord && currentRecord.id) {
      updateRecord(currentRecord.id as string, values);
      setIsEditDialogOpen(false);
    }
  };

  // Helper function to render cell values
  const renderCellValue = (value: any, column: string) => {
    if (value === null || value === undefined) return "-";
    
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    
    if (column.includes("date") || column.includes("_at")) {
      try {
        return new Date(value).toLocaleString();
      } catch (e) {
        return value;
      }
    }
    
    return String(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{displayName}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" size="icon" onClick={() => fetchData()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Column visibility dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  <Columns3 className="mr-2 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter(
                    (column) => 
                      column.getCanHide() && 
                      column.id !== "select" && 
                      column.id !== "actions"
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id
                          .split("_")
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Create button (if not read-only) */}
            {!readOnly && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add {displayName}
              </Button>
            )}
          </div>
        </div>
        
        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} total records
          </div>
          
          {table.getPageCount() > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronFirst className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronLast className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
        
        {/* Dialogs for CRUD operations */}
        {!readOnly && (
          <>
            <TableRecordDialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              title={`Create New ${displayName}`}
              record={{}}
              fields={columns
                .filter(col => col && col.id && col.id !== "actions")
                .map(col => ({
                  id: col.id,
                  header: col.id 
                    ? col.id
                        .split("_")
                        .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
                        .join(" ")
                    : "Unknown",
                  accessorKey: col.id
                }))}
              onSubmit={handleCreate}
            />
            
            <TableRecordDialog
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              title={`Edit ${displayName}`}
              record={currentRecord || {}}
              fields={columns
                .filter(col => col && col.id && col.id !== "actions")
                .map(col => ({
                  id: col.id,
                  header: col.id 
                    ? col.id
                        .split("_")
                        .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
                        .join(" ")
                    : "Unknown",
                  accessorKey: col.id
                }))}
              onSubmit={handleUpdate}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
