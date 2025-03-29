import { useParams } from 'react-router-dom';
import { useInvoiceDetail } from '@/hooks/useInvoiceDetail';
import { InvoiceDetailView } from '@/components/new/invoices';
import { InvoiceWithAccount } from '@/types/new/invoice';

/**
 * Page component for displaying the details of a single invoice.
 */
const InvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>(); // Get invoice ID from URL
  const { invoice, isLoading, error } = useInvoiceDetail(id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Error loading invoice: {error}
      </div>
    );
  }

  if (!invoice) {
    return <div className="p-4 text-center">Invoice not found.</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Pass the fetched invoice data to the display component */}
      <InvoiceDetailView invoice={invoice} />
    </div>
  );
};

export default InvoiceDetailPage;
