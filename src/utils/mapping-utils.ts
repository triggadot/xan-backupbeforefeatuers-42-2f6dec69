
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
  return {
    id: glInvoice.id,
    // Add other mapping fields here
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
