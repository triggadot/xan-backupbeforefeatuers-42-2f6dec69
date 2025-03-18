
import { 
  Invoice, 
  LineItem, 
  PurchaseOrder,
  Account 
} from '@/types';

/**
 * Map database gl_invoice_lines to LineItem type
 */
export const mapToLineItem = (item: any): LineItem => {
  return {
    id: item.id,
    productId: item.rowid_products || '',
    description: item.renamed_product_name || 'Unknown Product',
    quantity: Number(item.qty_sold) || 0,
    unitPrice: Number(item.selling_price) || 0,
    total: Number(item.line_total) || 0
  };
};

/**
 * Map database gl_purchase_order_items to LineItem type
 */
export const mapPurchaseOrderItemToLineItem = (item: any): LineItem => {
  return {
    id: item.id,
    productId: item.rowid_products || '',
    description: item.product_name || 'Unknown Product',
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unit_price) || 0,
    total: Number(item.total) || 0
  };
};

/**
 * Map database gl_accounts to Account type
 */
export const mapGlAccountToAccount = (glAccount: any): Account => {
  return {
    id: glAccount.id,
    name: glAccount.account_name || 'Unnamed Account',
    type: (glAccount.client_type?.toLowerCase() as 'customer' | 'vendor' | 'both') || 'customer',
    email: glAccount.email_of_who_added || '',
    phone: '',
    address: '',
    website: '',
    notes: '',
    status: 'active',
    balance: 0,
    createdAt: new Date(glAccount.created_at),
    updatedAt: new Date(glAccount.updated_at)
  };
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};
