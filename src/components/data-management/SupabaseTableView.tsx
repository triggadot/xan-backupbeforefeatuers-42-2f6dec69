import { useEffect, useMemo, useRef, useState, useCallback, KeyboardEvent } from "react";
import { useTableData, TableName } from "@/hooks/useTableData";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  PaginationState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleX,
  Columns3,
  Download,
  Edit,
  Ellipsis,
  Filter,
  ListFilter,
  PlusCircle,
  RefreshCw,
  Save,
  Trash,
  Check,
  X,
} from "lucide-react";
import TableRecordDialog from "./TableRecordDialog";

// Define type for general record with ID
type TableRecord = Record<string, unknown> & { id: string };

interface SupabaseTableViewProps {
  tableName: string;
  displayName: string;
  description?: string;
}

// EditableCell component for inline editing
interface EditableCellProps {
  value: any;
  row: Row<TableRecord>;
  column: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (value: any) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function EditableCell({
  value,
  row,
  column,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onKeyDown,
}: EditableCellProps) {
  const [editValue, setEditValue] = useState<any>(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const isBoolean = typeof value === "boolean";
  const isLongText = typeof value === "string" && value.length > 100;
  const isDate = 
    typeof value === "string" && 
    (column.includes("date") || column.includes("created_at") || column.includes("updated_at") || column.includes("timestamp"));
  
  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Reset edit value when value changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Handle save
  const handleSave = () => {
    onSaveEdit(editValue);
  };

  // Render view mode (non-editing)
  if (!isEditing) {
    return (
      <div 
        className="py-2 px-1 -mx-1 rounded hover:bg-muted/50 cursor-pointer min-h-[36px] flex items-center"
        onClick={onStartEdit}
      >
        {renderCellValue(value, column)}
      </div>
    );
  }

  // Render edit mode
  return (
    <div className="flex items-center gap-1">
      {isBoolean ? (
        <Select
          value={editValue?.toString()}
          onValueChange={(val) => setEditValue(val === "true")}
        >
          <SelectTrigger className="h-8 w-[120px]" autoFocus>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      ) : isLongText ? (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue || ""}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-24 min-w-[200px]"
          onKeyDown={onKeyDown}
        />
      ) : isDate ? (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="datetime-local"
          value={formatDateForInput(editValue)}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-8"
          onKeyDown={onKeyDown}
        />
      ) : (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={typeof value === "number" ? "number" : "text"}
          value={editValue || ""}
          onChange={(e) => {
            const val = e.target.type === "number" 
              ? e.target.value ? Number(e.target.value) : null
              : e.target.value;
            setEditValue(val);
          }}
          className="h-8"
          onKeyDown={onKeyDown}
        />
      )}
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={handleSave}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={onCancelEdit}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Helper function to format date for datetime-local input
function formatDateForInput(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    // Format: YYYY-MM-DDThh:mm
    return date.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

// Helper function to render cell value based on type
function renderCellValue(value: any, column: string) {
  if (value === null || value === undefined) return "--";

  // Format dates
  if (
    typeof value === "string" &&
    (column.includes("date") || column.includes("created_at") || column.includes("updated_at") || column.includes("timestamp"))
  ) {
    try {
      return new Date(value as string).toLocaleString();
    } catch {
      return value;
    }
  }

  // Format boolean values
  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "outline"}>
        {value ? "Yes" : "No"}
      </Badge>
    );
  }

  // Truncate long text
  if (typeof value === "string" && value.length > 50) {
    return (
      <div title={value as string}>
        {(value as string).substring(0, 47)}...
      </div>
    );
  }

  // Handle JSON objects
  if (typeof value === "object" && value !== null) {
    return (
      <div className="max-w-xs truncate" title={JSON.stringify(value)}>
        {JSON.stringify(value).substring(0, 30)}...
      </div>
    );
  }

  return String(value);
}

export default function SupabaseTableView({ tableName, displayName, description }: SupabaseTableViewProps) {
  const { data, isLoading, error, fetchData, createRecord, updateRecord, deleteRecord } = useTableData<TableRecord>(
    tableName as TableName
  );

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<TableRecord | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // State for inline editing
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, any>>>({});

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle record edit
  const handleEdit = useCallback((record: TableRecord) => {
    setCurrentRecord(record);
    setIsEditDialogOpen(true);
  }, []);

  // Handle cell edit start
  const handleCellEditStart = useCallback((rowId: string, columnId: string) => {
    // Don't allow editing special columns
    if (
      columnId === "id" ||
      columnId === "glide_row_id" ||
      columnId === "created_at" ||
      columnId === "updated_at" ||
      columnId === "select" ||
      columnId === "actions"
    ) {
      return;
    }
    
    setEditingCell({ rowId, columnId });
  }, []);

  // Handle cell edit cancel
  const handleCellEditCancel = useCallback(() => {
    setEditingCell(null);
  }, []);

  // Handle cell edit save
  const handleCellEditSave = useCallback((rowId: string, columnId: string, value: any) => {
    // Update pending changes
    setPendingChanges(prev => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [columnId]: value
      }
    }));
    
    // Save changes immediately
    const row = data.find(item => item.id === rowId);
    if (row) {
      updateRecord(rowId, { [columnId]: value });
    }
    
    // Exit edit mode
    setEditingCell(null);
  }, [data, updateRecord]);

  // Handle keyboard navigation
  const handleCellKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, rowId: string, columnId: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const row = data.find(item => item.id === rowId);
      if (row) {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        handleCellEditSave(rowId, columnId, target.value);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCellEditCancel();
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Handle tab navigation between cells
      // This would require more complex logic to determine the next editable cell
      handleCellEditCancel();
    }
  }, [data, handleCellEditCancel, handleCellEditSave]);

  // Create a memoized row actions component to avoid dependency issues
  const rowActionsCell = useCallback(({ row }: { row: Row<TableRecord> }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <Ellipsis className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleEdit(row.original)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              if (confirm(`Are you sure you want to delete this record?`)) {
                deleteRecord(row.original.id);
              }
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }, [handleEdit, deleteRecord]);

  // Dynamically build columns from data
  const columns = useMemo<ColumnDef<TableRecord>[]>(() => {
    if (data.length === 0) {
      return [
        {
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() 
                  ? true 
                  : table.getIsSomePageRowsSelected() 
                    ? "indeterminate" 
                    : false
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
            />
          ),
          enableSorting: false,
          enableHiding: false,
        },
        {
          id: "id",
          header: "ID",
          accessorKey: "id",
        },
        {
          id: "empty",
          header: "No Data",
          accessorKey: "empty",
        },
      ];
    }

    const record = data[0];
    const dynamicColumns: ColumnDef<TableRecord>[] = Object.keys(record).map((key) => ({
      id: key,
      header: key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      accessorKey: key,
      cell: ({ row }) => {
        const value = row.getValue(key);
        const rowId = row.original.id;
        const isEditing = 
          editingCell !== null && 
          editingCell.rowId === rowId && 
          editingCell.columnId === key;
        
        // Special handling for read-only columns
        if (
          key === "id" ||
          key === "glide_row_id" ||
          key === "created_at" ||
          key === "updated_at"
        ) {
          return renderCellValue(value, key);
        }
        
        return (
          <EditableCell
            value={value}
            row={row}
            column={key}
            isEditing={isEditing}
            onStartEdit={() => handleCellEditStart(rowId, key)}
            onCancelEdit={handleCellEditCancel}
            onSaveEdit={(newValue) => handleCellEditSave(rowId, key, newValue)}
            onKeyDown={(e) => handleCellKeyDown(e, rowId, key)}
          />
        );
      },
    }));

    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() 
                ? true 
                : table.getIsSomePageRowsSelected() 
                  ? "indeterminate" 
                  : false
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
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...dynamicColumns,
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: rowActionsCell,
        enableSorting: false,
        enableHiding: false,
      },
    ];
  }, [data, rowActionsCell, editingCell, handleCellEditStart, handleCellEditCancel, handleCellEditSave, handleCellKeyDown]);

  // React Table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const searchableValue = String(
        row.getValue(columnId) || ""
      ).toLowerCase();
      return searchableValue.includes(String(filterValue).toLowerCase());
    },
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  // Handle bulk delete of selected rows
  const handleDeleteSelected = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const selectedIds = selectedRows.map((row) => row.original.id);
    
    for (const id of selectedIds) {
      await deleteRecord(id);
    }
    
    table.resetRowSelection();
  };

  // Handle record creation
  const handleCreate = async (values: Record<string, unknown>) => {
    await createRecord(values);
    setIsCreateDialogOpen(false);
  };

  // Handle record update
  const handleUpdate = async (values: Record<string, unknown>) => {
    if (currentRecord?.id) {
      await updateRecord(currentRecord.id, values);
      setIsEditDialogOpen(false);
      setCurrentRecord(null);
    }
  };

  // Loading state
  if (isLoading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading {displayName}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 text-destructive p-4">
        <h2 className="font-medium">Error loading {displayName}</h2>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Global filter */}
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="Search all columns..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className={cn("min-w-64 ps-9", Boolean(globalFilter) && "pe-9")}
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
              <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
            </div>
            {Boolean(globalFilter) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  setGlobalFilter("");
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <CircleX size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Refresh data */}
          <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* Toggle columns visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="mr-2 h-4 w-4" />
                Columns
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
                      {column.id
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-3">
          {/* Selected rows actions */}
          {table.getSelectedRowModel().rows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                  <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                    {table.getSelectedRowModel().rows.length}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
                    aria-hidden="true"
                  >
                    <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
                  </div>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete{" "}
                      {table.getSelectedRowModel().rows.length} selected{" "}
                      {table.getSelectedRowModel().rows.length === 1 ? "record" : "records"}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Add new record button */}
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add {displayName}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <div
                            className={cn(
                              "flex items-center gap-2 cursor-pointer select-none",
                              header.column.getCanSort() && "cursor-pointer select-none"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <ChevronUp className="h-4 w-4" />,
                              desc: <ChevronDown className="h-4 w-4" />,
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
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                    {isLoading ? (
                      <div className="flex justify-center items-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </div>
                    ) : (
                      "No results found"
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4">
        {/* Results per page */}
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground">Rows per page</Label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page status */}
        <div className="flex-1 text-sm text-muted-foreground text-center">
          <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> total records
        </div>

        {/* Pagination controls */}
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

      {/* Create Record Dialog */}
      <TableRecordDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title={`Create New ${displayName}`}
        record={{}}
        fields={columns.filter(col => col.id !== "select" && col.id !== "actions").map(col => ({
          id: col.id,
          header: col.id
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          accessorKey: col.id
        }))}
        onSubmit={handleCreate}
      />

      {/* Edit Record Dialog */}
      <TableRecordDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title={`Edit ${displayName}`}
        record={currentRecord || {}}
        fields={columns.filter(col => col.id !== "select" && col.id !== "actions").map(col => ({
          id: col.id,
          header: col.id
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          accessorKey: col.id
        }))}
        onSubmit={handleUpdate}
      />
    </div>
  );
} 
