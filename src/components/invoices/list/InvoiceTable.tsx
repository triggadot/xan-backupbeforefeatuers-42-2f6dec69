import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, MoreHorizontal, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '../shared/StatusBadge';
import { AmountDisplay } from '../shared/AmountDisplay';
import { InvoiceListItem } from '@/types/invoiceView';
import { formatDate } from '@/utils/format-utils';
import { useToast } from '@/hooks/use-toast';
import { generateAndStorePDF, generateInvoicePDF } from "@/lib/pdf-utils";

interface InvoiceTableProps {
  data: InvoiceListItem[];
  onEdit: (invoice: InvoiceListItem) => void;
  onDelete: (invoice: InvoiceListItem) => void;
  onCreateInvoice: () => void;
}

export const InvoiceTable = ({
  data,
  onEdit,
  onDelete,
  onCreateInvoice,
}: InvoiceTableProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const handleViewPdf = async (invoice: InvoiceListItem) => {
    // Check if we have a direct link
    if (invoice.supabase_pdf_url || invoice.pdf_link) {
      const pdfUrl = invoice.supabase_pdf_url || invoice.pdf_link;
      window.open(pdfUrl, '_blank');
    } else {
      // If no direct link, we need to generate the PDF
      toast({
        title: 'Generating PDF',
        description: 'The PDF is being generated, please wait...',
      });
      
      try {
        // Generate and store the PDF
        const pdfUrl = await generateAndStorePDF('invoice', invoice as any, false);
        
        if (pdfUrl) {
          // Open the PDF in a new tab
          window.open(pdfUrl, '_blank');
          
          toast({
            title: 'PDF Generated',
            description: 'Your invoice PDF has been generated and opened in a new tab.',
          });
        } else {
          throw new Error('Failed to generate PDF');
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: 'Error',
          description: 'Failed to generate PDF.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDownloadPdf = async (invoice: InvoiceListItem) => {
    // Check if we have a direct link
    if (invoice.supabase_pdf_url || invoice.pdf_link) {
      const pdfUrl = invoice.supabase_pdf_url || invoice.pdf_link;
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `${invoice.invoiceNumber || 'invoice'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // If no direct link, we need to generate the PDF
      toast({
        title: 'Generating PDF',
        description: 'The PDF is being generated for download, please wait...',
      });
      
      try {
        // Generate the PDF
        const doc = generateInvoicePDF(invoice as any);
        
        // Save the PDF locally
        doc.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
        
        // Also store it in Supabase for future use
        generateAndStorePDF('invoice', invoice as any, false)
          .then(url => {
            if (url) {
              toast({
                title: 'PDF Stored',
                description: 'Your invoice PDF has been stored for future use.',
              });
            }
          })
          .catch(error => {
            console.error('Error storing PDF:', error);
          });
        
        toast({
          title: 'PDF Downloaded',
          description: 'Your invoice PDF has been generated and downloaded.',
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: 'Error',
          description: 'Failed to generate PDF for download.',
          variant: 'destructive',
        });
      }
    }
  };

  const columns: ColumnDef<InvoiceListItem>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('invoiceNumber')}</div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => formatDate(row.getValue('date')),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue('customerName')}</div>
      ),
    },
    {
      accessorKey: 'lineItemsCount',
      header: 'Items',
      cell: ({ row }) => row.getValue('lineItemsCount'),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <AmountDisplay amount={row.getValue('total')} className="font-medium" />
      ),
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }) => {
        const balance = row.getValue<number>('balance');
        return (
          <AmountDisplay 
            amount={balance} 
            variant={balance > 0 ? 'warning' : 'success'}
          />
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as 
          'draft' | 'sent' | 'overdue' | 'paid' | 'partial';
        return <StatusBadge status={status} />;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const invoice = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigate(`/invoices/${invoice.id}`)}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(invoice)}>
                Edit Invoice
              </DropdownMenuItem>
              {(invoice.supabase_pdf_url || invoice.pdf_link) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleViewPdf(invoice)}>
                    <FileText className="mr-2 h-4 w-4" />
                    View PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadPdf(invoice)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(invoice)}
                className="text-destructive focus:text-destructive"
              >
                Delete Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4 justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
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
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
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
                  className="cursor-pointer"
                  onClick={() => navigate(`/invoices/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No invoices found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
