import { Account, GlAccount } from '@/types';
import { normalizeClientType } from './gl-account-mappings';

/**
 * Maps data from gl_accounts table to Account interface
 */
export function mapGlAccountToAccount(glAccount: GlAccount): Account {
  return {
    id: glAccount.id,
    name: glAccount.account_name || 'Unnamed Account',
    // Make sure the client type is normalized to match constraint
    type: normalizeClientType(glAccount.client_type) as Account['type'] || 'Customer',
    email: glAccount.email_of_who_added || '',
    status: 'active', // Default status as this is not in the database
    balance: 0, // Default balance as this is not in the database
    createdAt: new Date(glAccount.created_at || Date.now()),
    updatedAt: new Date(glAccount.updated_at || Date.now()),
    photo: glAccount.photo,
    accounts_uid: glAccount.accounts_uid,
  };
}

/**
 * Format currency values for display
 */
export function formatCurrency(amount: number | null | undefined, currency: string = 'USD'): string {
  if (amount === null || amount === undefined) return '-';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Maps data from gl_invoices table to Invoice interface
 */
export function mapGlInvoiceToInvoice(glInvoice: any): any {
  // Extract data from the glInvoice object
  const {
    id,
    invoice_number,
    invoice_date,
    due_date,
    total_amount,
    balance_due,
    payment_status,
    notes,
    glide_row_id,
    created_at,
    updated_at
  } = glInvoice;
  
  // Get related data that might be passed with the invoice
  const accountName = glInvoice.accountName || 'Unknown Account';
  const lineItems = glInvoice.lineItems || [];
  const payments = glInvoice.payments || [];
  
  return {
    id,
    invoiceNumber: invoice_number,
    invoiceDate: invoice_date,
    dueDate: due_date,
    totalAmount: total_amount,
    balanceDue: balance_due,
    paymentStatus: payment_status || 'unpaid',
    notes,
    accountName,
    lineItems,
    payments,
    glideRowId: glide_row_id,
    createdAt: new Date(created_at || Date.now()),
    updatedAt: new Date(updated_at || Date.now())
  };
}

/**
 * Maps data from gl_purchase_orders table to PurchaseOrder interface
 */
export function mapGlPurchaseOrderToPurchaseOrder(glPO: any): any {
  return {
    id: glPO.id,
    // Add other mapping fields here
  };
}
