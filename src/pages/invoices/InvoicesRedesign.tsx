import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, DownloadIcon, SearchIcon, BarChart3Icon, TableIcon } from 'lucide-react';
import { useInvoices } from '@/hooks/invoices';
import { useToast } from '@/hooks/utils/use-toast';
import { formatCurrency } from '@/lib/utils';
import { InvoiceWithAccount } from '@/types/invoice';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// Import Tremor components for charts
import { DonutChart, AreaChart } from '@tremor/react';

const InvoicesRedesign = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<keyof InvoiceWithAccount | null>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showCharts, setShowCharts] = useState(true);
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
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort invoices
  const filteredInvoices = invoices
    .filter((invoice) => {
      const matchesSearch = 
        invoice.rowid_accounts?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.glide_row_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id?.toString().includes(searchTerm);
      
      const matchesStatus = 
        selectedStatus === 'all' || 
        invoice.payment_status?.toLowerCase() === selectedStatus.toLowerCase();
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;

      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      let comparison = 0;
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }
      
      if (sortColumn === 'invoice_order_date' || sortColumn === 'created_at' || sortColumn === 'due_date') {
        const dateA = aValue ? new Date(aValue).getTime() : 0;
        const dateB = bValue ? new Date(bValue).getTime() : 0;
        comparison = dateA - dateB;
      }

      return sortDirection === 'asc' ? comparison : comparison * -1;
    });

  // Export function
  const handleExportPDF = () => {
    toast({
      title: 'Export Started',
      description: 'Your invoices are being exported to PDF.',
    });
    // Implement PDF export functionality
  };

  // Status options matching database statuses
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'paid', label: 'Paid' },
    { value: 'partial', label: 'Partial' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'credit', label: 'Credit' },
  ];

  // Calculate summary metrics
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  const paidInvoices = invoices.filter(invoice => invoice.payment_status === 'paid');
  const totalPaid = paidInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  const pendingInvoices = invoices.filter(invoice => ['unpaid', 'partial'].includes(invoice.payment_status || ''));
  const totalPending = pendingInvoices.reduce((sum, invoice) => sum + (invoice.balance || 0), 0);
  const overdueInvoices = invoices.filter(invoice => 
    ['unpaid', 'partial'].includes(invoice.payment_status || '') && 
    invoice.due_date && new Date(invoice.due_date) < new Date()
  );
  const totalOverdue = overdueInvoices.reduce((sum, invoice) => sum + (invoice.balance || 0), 0);

  // Chart data
  const statusData = [
    { name: 'Paid', value: paidInvoices.length, color: 'emerald' },
    { name: 'Pending', value: pendingInvoices.length, color: 'amber' },
    { name: 'Overdue', value: overdueInvoices.length, color: 'rose' },
  ];

  // Prepare monthly chart data
  const monthlyData = (() => {
    const data: { month: string, Paid: number, Pending: number, Overdue: number }[] = [];
    const today = new Date();
    
    // Create entries for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      data.push({ month: monthKey, Paid: 0, Pending: 0, Overdue: 0 });
    }
    
    // Map to easily access month data
    const monthMap = new Map(data.map(item => [item.month, item]));
    
    // Populate with actual invoice data
    invoices.forEach(invoice => {
      if (!invoice.created_at) return;
      
      const invoiceDate = new Date(invoice.created_at);
      const monthKey = invoiceDate.toLocaleString('default', { month: 'short' });
      const monthData = monthMap.get(monthKey);
      
      if (monthData) {
        if (invoice.payment_status === 'paid') {
          monthData.Paid += (invoice.total_amount || 0);
        } else if (['unpaid', 'partial'].includes(invoice.payment_status || '')) {
          if (invoice.due_date && new Date(invoice.due_date) < today) {
            monthData.Overdue += (invoice.balance || 0);
          } else {
            monthData.Pending += (invoice.balance || 0);
          }
        }
      }
    });
    
    return data;
  })();

  // Function to render status badge
  const renderStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;
    
    const variants: Record<string, string> = {
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      unpaid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      credit: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
    
    return (
      <Badge className={variants[status.toLowerCase()] || ''}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      {/* Header with responsive design */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer invoices and payments
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Mobile-friendly action buttons */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search & Filter
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>Search & Filter</SheetTitle>
                <SheetDescription>Find invoices by keyword or status</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile-search">Search</Label>
                  <Input
                    id="mobile-search"
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile-status">Status</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger id="mobile-status">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile-charts">Show Charts</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="mobile-charts"
                      checked={showCharts}
                      onCheckedChange={setShowCharts}
                    />
                    <Label htmlFor="mobile-charts">
                      {showCharts ? 'Charts visible' : 'Charts hidden'}
                    </Label>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Desktop action buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="hidden md:flex"
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Link to="/invoices/new">
            <Button size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvoiced)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalOverdue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Invoice List</CardTitle>
              <CardDescription>
                {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            
            {/* Search & Filter - Desktop */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="hidden md:block relative w-full sm:w-64">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                className="hidden md:inline-flex w-full sm:w-auto"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Visualization Toggle */}
              <div className="hidden md:flex items-center space-x-2">
                <Switch
                  id="charts-toggle"
                  checked={showCharts}
                  onCheckedChange={setShowCharts}
                />
                <Label htmlFor="charts-toggle" className="whitespace-nowrap">
                  {showCharts ? (
                    <span className="flex items-center"><BarChart3Icon className="h-4 w-4 mr-1" /> Show Charts</span>
                  ) : (
                    <span className="flex items-center"><TableIcon className="h-4 w-4 mr-1" /> Hide Charts</span>
                  )}
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Invoice Table */}
          <div className="rounded-md border">
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('invoice_order_date')}>
                      Date
                      {sortColumn === 'invoice_order_date' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('glide_row_id')}>
                      Reference
                      {sortColumn === 'glide_row_id' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Customer</TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort('total_amount')}>
                      Amount
                      {sortColumn === 'total_amount' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </TableHead>
                    <TableHead className="text-right hidden sm:table-cell cursor-pointer" onClick={() => handleSort('balance')}>
                      Balance
                      {sortColumn === 'balance' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading state
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-[60px]" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredInvoices.length === 0 ? (
                    // Empty state
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No invoices found. Try adjusting your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Data rows
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="group">
                        <TableCell className="font-medium">
                          {invoice.invoice_order_date 
                            ? new Date(invoice.invoice_order_date).toLocaleDateString() 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Link to={`/invoices/${invoice.id}`} className="hover:underline text-blue-600">
                            {invoice.glide_row_id || 'Unknown'}
                          </Link>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {invoice.account?.account_name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.total_amount || 0)}
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          {formatCurrency(invoice.balance || 0)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {renderStatusBadge(invoice.payment_status)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                <span className="sr-only">Open menu</span>
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                  <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link to={`/invoices/${invoice.id}`}>
                                <DropdownMenuItem>View details</DropdownMenuItem>
                              </Link>
                              <Link to={`/invoices/${invoice.id}/edit`}>
                                <DropdownMenuItem>Edit invoice</DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem>Generate PDF</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Toggleable Visualizations Section */}
      {showCharts && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Analytics</CardTitle>
            <CardDescription>Visualize your invoice data</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="charts" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="charts">Status Distribution</TabsTrigger>
                <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
              </TabsList>
              <TabsContent value="charts" className="space-y-4">
                <div className="pt-4 flex flex-col items-center">
                  <h3 className="text-lg font-medium mb-4">Invoice Status Distribution</h3>
                  <div className="h-[300px] w-full max-w-lg">
                    <DonutChart
                      data={statusData}
                      category="value"
                      index="name"
                      colors={["emerald", "amber", "rose"]}
                      showAnimation
                      valueFormatter={(value) => `${value} invoice${value !== 1 ? 's' : ''}`}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="trends">
                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-4">Invoice Trends (Last 6 Months)</h3>
                  <div className="h-[300px] w-full">
                    <AreaChart
                      data={monthlyData}
                      index="month"
                      categories={["Paid", "Pending", "Overdue"]}
                      colors={["emerald", "amber", "rose"]}
                      valueFormatter={(value) => formatCurrency(value)}
                      showLegend
                      showAnimation
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvoicesRedesign;
