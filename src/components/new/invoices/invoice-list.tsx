import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, PencilIcon, DownloadIcon, ShareIcon, ArrowUpDownIcon } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/utils/use-toast';
import { InvoiceWithAccount } from '@/types/new/invoice';
import { format } from 'date-fns';

type SortableColumn = keyof Pick<InvoiceWithAccount, 'invoice_order_date' | 'total_amount' | 'payment_status' | 'account'> | 'account.name';
type SortDirection = 'asc' | 'desc';

interface InvoiceListProps {
  invoices: InvoiceWithAccount[];
  isLoading: boolean;
  sortColumn: SortableColumn | null;
  sortDirection: SortDirection;
  onSort: (column: SortableColumn) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, isLoading, sortColumn, sortDirection, onSort }) => {
  const { toast } = useToast();
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedInvoices(invoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices([...selectedInvoices, id]);
    } else {
      setSelectedInvoices(selectedInvoices.filter(invoiceId => invoiceId !== id));
    }
  };

  const handleDownloadPdf = (id: string) => {
    toast({
      title: 'Download Started',
      description: 'Your invoice PDF is being prepared for download.',
    });
    // Implement PDF download functionality
    // You can use the doc_glideforeverlink field from your database if available
  };

  const handleShareInvoice = (id: string) => {
    toast({
      title: 'Share Options',
      description: 'Invoice sharing options opened.',
    });
    // Implement invoice sharing functionality
  };

  const formatInvoiceNumber = (invoice: InvoiceWithAccount) => {
    try {
      // Get account_uid from account, if available
      const accountUid = invoice.account?.accounts_uid || 'NOACC';
      
      // Format the date as MMDDYY
      let dateString = 'NODATE';
      if (invoice.invoice_order_date) {
        const invoiceDate = new Date(invoice.invoice_order_date);
        dateString = format(invoiceDate, 'MMddyy');
      }
      
      // Create the formatted invoice number
      return `INV#${accountUid}${dateString}`;
    } catch (err) {
      console.error('Error formatting invoice number:', err);
      return invoice.id?.substring(0, 8) || 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <svg className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium">No invoices found</h3>
        <p className="text-gray-500 mt-1">Create your first invoice to get started</p>
        <Link to="/invoices/new">
          <button 
            type="button"
            className="mt-4 py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            Create Invoice
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Preline UI Table */}
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th scope="col" className="px-6 py-3 text-start">
              <div className="flex items-center gap-x-2">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox"
                    className="relative shrink-0 w-4 h-4 border border-gray-200 rounded-sm text-blue-600 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white focus:ring-2 focus:outline-none checked:bg-blue-600 checked:border-blue-600"
                    onChange={handleSelectAll}
                    checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                  />
                </div>
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
              <button type="button" onClick={() => onSort('account.name')} className="px-0">
                Account
                {sortColumn === 'account.name' && (
                  <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                )}
              </button>
            </th>
            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
              <button type="button" onClick={() => onSort('invoice_order_date')} className="px-0">
                Date
                {sortColumn === 'invoice_order_date' && (
                  <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                )}
              </button>
            </th>
            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
              <button type="button" onClick={() => onSort('total_amount')} className="px-0 text-right">
                Total Amount
                {sortColumn === 'total_amount' && (
                  <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                )}
              </button>
            </th>
            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
              <button type="button" onClick={() => onSort('payment_status')} className="px-0">
                Status
                {sortColumn === 'payment_status' && (
                  <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                )}
              </button>
            </th>
            <th scope="col" className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex items-center gap-x-2">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      className="relative shrink-0 w-4 h-4 border border-gray-200 rounded-sm text-blue-600 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white focus:ring-2 focus:outline-none checked:bg-blue-600 checked:border-blue-600"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                    />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                  {formatInvoiceNumber(invoice)}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {invoice.account ? (
                  <div>
                    <Link 
                      to={`/accounts/${invoice.account.id}`} 
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {invoice.account.account_name || 'Unnamed Account'}
                    </Link>
                    {invoice.account.accounts_uid && (
                      <div className="text-xs text-gray-500">
                        <Link 
                          to={`/accounts/${invoice.account.id}`} 
                          className="hover:text-blue-600 hover:underline"
                        >
                          {invoice.account.accounts_uid}
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500">No account: {invoice.rowid_accounts || 'N/A'}</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(invoice.invoice_order_date)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(invoice.total_amount)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {/* Updated badge logic for DATABASE statuses */}
                <span className={`inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-xs font-medium ${ 
                  invoice.payment_status?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500' :
                  invoice.payment_status?.toLowerCase() === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500' :
                  invoice.payment_status?.toLowerCase() === 'unpaid' ? 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-500' :
                  invoice.payment_status?.toLowerCase() === 'credit' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-500' :
                  // Default for 'draft' or unknown
                  'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-500'
                }`}>
                  <span className="w-1.5 h-1.5 inline-block rounded-full bg-current"></span>
                  {invoice.payment_status || 'Unknown'} 
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:pointer-events-none"
                    onClick={() => handleDownloadPdf(invoice.id)}
                    title="Download PDF"
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:pointer-events-none"
                    onClick={() => handleShareInvoice(invoice.id)}
                    title="Share Invoice"
                  >
                    <ShareIcon className="h-4 w-4" />
                  </button>
                  <Link to={`/invoices/${invoice.id}`}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:pointer-events-none"
                      title="View Invoice"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </Link>
                  <Link to={`/invoices/${invoice.id}/edit`}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:pointer-events-none"
                      title="Edit Invoice"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList;
