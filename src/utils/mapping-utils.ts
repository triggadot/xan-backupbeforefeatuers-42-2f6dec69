
import { Account, GlAccount, Invoice, PurchaseOrder, GlInvoice, GlPurchaseOrder, GlCustomerPayment, GlVendorPayment, Payment } from '@/types';

// Format currency values for display
export const formatCurrency = (value: number | undefined): string => {
  if (value === undefined) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Map database GlAccount to application Account type
export const mapGlAccountToAccount = (dbAccount: GlAccount): Account => {
  // Map the client_type to the appropriate type
  let accountType: 'customer' | 'vendor' | 'both' = 'customer';
  
  if (dbAccount.client_type) {
    if (dbAccount.client_type.includes('vendor') && dbAccount.client_type.includes('customer')) {
      accountType = 'both';
    } else if (dbAccount.client_type.includes('vendor')) {
      accountType = 'vendor';
    } else if (dbAccount.client_type.includes('customer')) {
      accountType = 'customer';
    }
  }
  
  return {
    id: dbAccount.id,
    name: dbAccount.account_name || '',
    type: accountType,
    email: dbAccount.email_of_who_added || '',
    status: 'active', // Default status
    balance: 0, // Default balance
    createdAt: dbAccount.created_at ? new Date(dbAccount.created_at) : new Date(),
    updatedAt: dbAccount.updated_at ? new Date(dbAccount.updated_at) : new Date(),
  };
};

// Map database GlInvoice to application Invoice type
export const mapGlInvoiceToInvoice = (dbInvoice: GlInvoice, accountName: string = 'Unknown', payments: GlCustomerPayment[] = []): Invoice => {
  // Calculate the total and balance from the provided data
  const total = dbInvoice.total_amount || 0;
  const amountPaid = dbInvoice.total_paid || 0;
  const balance = dbInvoice.balance || (total - amountPaid);
  
  // Map to the Invoice type
  return {
    id: dbInvoice.id,
    number: dbInvoice.glide_row_id || '',
    date: dbInvoice.invoice_order_date ? new Date(dbInvoice.invoice_order_date) : new Date(),
    dueDate: undefined, // Not in the database schema
    accountId: dbInvoice.rowid_accounts || '',
    accountName: accountName,
    subtotal: total, // Subtotal is same as total since we don't track tax separately
    tax: 0, // Not in the database schema
    total: total,
    notes: dbInvoice.notes || '',
    lineItems: [], // This would need to be populated separately
    status: (dbInvoice.processed ? 'sent' : 'draft') as 'draft' | 'sent' | 'overdue' | 'paid' | 'partial',
    balance: balance,
    amountPaid: amountPaid,
    payments: payments.map(payment => ({
      id: payment.id,
      date: payment.date_of_payment ? new Date(payment.date_of_payment) : new Date(),
      amount: payment.payment_amount || 0,
      method: payment.type_of_payment,
      notes: payment.payment_note
    })),
    createdAt: dbInvoice.created_at ? new Date(dbInvoice.created_at) : new Date(),
    updatedAt: dbInvoice.updated_at ? new Date(dbInvoice.updated_at) : new Date(),
  };
};

// Map database GlPurchaseOrder to application PurchaseOrder type
export const mapGlPurchaseOrderToPurchaseOrder = (dbPO: GlPurchaseOrder, accountName: string = 'Unknown', payments: GlVendorPayment[] = []): PurchaseOrder => {
  // Calculate the total and balance from the provided data
  const total = dbPO.total_amount || 0;
  const amountPaid = dbPO.total_paid || 0;
  const balance = dbPO.balance || (total - amountPaid);
  
  // Map to the PurchaseOrder type
  return {
    id: dbPO.id,
    number: dbPO.purchase_order_uid || '',
    date: dbPO.po_date ? new Date(dbPO.po_date) : new Date(),
    dueDate: undefined, // Not in the database schema
    accountId: dbPO.rowid_accounts || '',
    accountName: accountName,
    subtotal: total, // Subtotal is same as total since we don't track tax separately
    tax: 0, // Not in the database schema
    total: total,
    notes: '', // Not directly in the schema
    lineItems: [], // This would need to be populated separately
    status: 'received', // Default status
    balance: balance,
    amountPaid: amountPaid,
    vendorId: dbPO.rowid_accounts || '',
    createdAt: dbPO.created_at ? new Date(dbPO.created_at) : new Date(),
    updatedAt: dbPO.updated_at ? new Date(dbPO.updated_at) : new Date(),
  };
};
