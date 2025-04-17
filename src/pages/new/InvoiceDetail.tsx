import { useParams } from 'react-router-dom';
import { useInvoiceDetail } from '@/hooks/invoices';
import { InvoiceDetailView } from '@/components/invoices';
import { Invoice as NewInvoice, InvoiceWithAccount as NewInvoiceWithAccount } from '@/types/new/invoice';

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

  // Create a minimal compatible invoice object for InvoiceDetailView
  const compatibleInvoice: NewInvoiceWithAccount = {
    id: invoice.id,
    glide_row_id: invoice.glide_row_id || '',
    invoice_order_date: invoice.invoiceDate?.toISOString() || null,
    created_timestamp: invoice.createdAt?.toISOString() || null,
    submitted_timestamp: invoice.createdAt?.toISOString() || null,
    user_email: null,
    notes: invoice.notes || null,
    doc_glideforeverlink: null,
    created_at: invoice.created_at,
    updated_at: invoice.updated_at || null,
    total_amount: invoice.total_amount || invoice.total || 0,
    total_paid: invoice.total_paid || 0,
    balance: invoice.balance || 0,
    payment_status: invoice.status || null,
    rowid_accounts: invoice.customerId || null,
    invoice_uid: invoice.invoiceNumber || null,
    lines: invoice.lineItems?.map(item => ({
      id: item.id,
      glide_row_id: '',
      renamed_product_name: item.productName || null,
      date_of_sale: item.createdAt?.toISOString() || null,
      rowid_invoices: item.invoiceId || null,
      rowid_products: item.productId || null,
      qty_sold: item.quantity || null,
      selling_price: item.unitPrice || null,
      product_sale_note: item.notes || null,
      user_email_of_added: null,
      created_at: item.createdAt?.toISOString() || null,
      updated_at: item.updatedAt?.toISOString() || null,
      line_total: item.total || null,
      product_name_display: item.description || null
    })) || [],
    account: invoice.account ? {
      id: invoice.account.id,
      glide_row_id: invoice.account.glideRowId || '',
      account_name: invoice.account.name || null,
      accounts_uid: invoice.account.glideRowId || '',
      email_of_who_added: null,
      client_type: null,
      balance: invoice.account.balance || null,
      created_at: null,
      updated_at: null
    } : undefined
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <InvoiceDetailView invoice={compatibleInvoice} />
    </div>
  );
};

export default InvoiceDetailPage;
