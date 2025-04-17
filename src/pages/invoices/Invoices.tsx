import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, DownloadIcon, SearchIcon } from 'lucide-react';
import InvoiceList from '@/components/invoices/InvoiceList';
import InvoiceStats from '@/components/invoices/InvoiceStats';
import { useToast } from '@/hooks/utils/use-toast';
import { formatCurrency } from '@/lib/utils';
import { useInvoices } from '@/hooks/invoices';

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<keyof InvoiceWithAccount | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();
  const { invoices, isLoading, error } = useInvoices();

  // Show error toast if there's an error from the hook
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load invoices',
        variant: 'destructive',
      });
      console.error('Error loading invoices:', error);
    }
  }, [error, toast]);

  const handleSort = (column: keyof InvoiceWithAccount) => {
    if (sortColumn === column) {
      // Toggle direction if same column is clicked again
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.rowid_accounts?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.glide_row_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id?.toString().includes(searchTerm);

    const matchesStatus =
      selectedStatus === 'all' ||
      invoice.payment_status?.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any;
    let bValue: any;

    aValue = a[sortColumn];
    bValue = b[sortColumn];

    let comparison = 0;
    if (aValue < bValue) {
      comparison = -1;
    } else if (aValue > bValue) {
      comparison = 1;
    }

    if (sortColumn === 'date_of_invoice{
      const dateA = aValue ? new Date(aValue).getTime() : 0;
      const dateB = bValue ? new Date(bValue).getTime() : 0;
      comparison = dateA - dateB;
    }

    return sortDirection === 'asc' ? comparison : comparison * -1;
  });

  const handleExportPDF = () => {
    toast({
      title: 'Export Started',
      description: 'Your invoices are being exported to PDF.',
    });
    // Implement PDF export functionality
  };

  // Updated status options to match DATABASE statuses
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },        // Database status
    { value: 'paid', label: 'Paid' },         // Database status
    { value: 'partial', label: 'Partial' },      // Database status
    { value: 'unpaid', label: 'Unpaid' },       // Database status
    { value: 'credit', label: 'Credit' },       // Database status (Balance < 0)
  ];

  // Calculate summary metrics
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  const totalPaid = invoices
    .filter(invoice => (invoice.balance || 0) <= 0 && (invoice.total_amount || 0) > 0)
    .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  const totalPending = invoices
    .filter(invoice => (invoice.balance || 0) > 0)
    .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  const totalOverdue = invoices
    .filter(invoice => (invoice.balance || 0) > 0 && invoice.due_date && new Date(invoice.due_date) < new Date())
    .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer invoices and payments
          </p>
        </div>
        <div className="flex gap-2">
          {/* Preline UI Button for Export */}
          <button
            type="button"
            className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleExportPDF}
          >
            <DownloadIcon className="h-4 w-4" />
            Export
          </button>

          {/* Preline UI Button for New Invoice */}
          <Link to="/invoices/new">
            <button
              type="button"
              className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
            >
              <PlusIcon className="h-4 w-4" />
              New Invoice
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <InvoiceStats invoices={invoices} />

      {/* Invoice List with Filters */}
      <div className="bg-white border shadow-sm rounded-xl dark:bg-slate-900 dark:border-gray-800">
        <div className="p-4 md:p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Invoice List</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none z-20 ps-4">
                  <SearchIcon className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="text"
                  className="py-2 px-4 ps-11 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-auto">
                <select
                  className="py-2 px-4 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Invoice List */}
          <div className="mt-6">
            <InvoiceList
              invoices={filteredInvoices}
              isLoading={isLoading}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
