
import { 
  Invoice, 
  LineItem, 
  PurchaseOrder,
  Account,
  GlAccount,
  GlInvoice,
  GlInvoiceLine,
  GlPurchaseOrder,
  GlVendorPayment,
  GlCustomerPayment,
  Payment,
  ProductDetails
} from '@/types';

/**
 * Map database gl_invoice_lines to LineItem type
 */
export const mapToLineItem = (item: GlInvoiceLine): LineItem => {
  return {
    id: item.id,
    productId: item.rowid_products || '',
    description: item.renamed_product_name || 'Unknown Product',
    quantity: Number(item.qty_sold) || 0,
    unitPrice: Number(item.selling_price) || 0,
    total: Number(item.line_total) || 0,
    productDetails: item.productDetails
  };
};

/**
 * Map database gl_purchase_order_lines to LineItem type
 */
export const mapPurchaseOrderItemToLineItem = (item: any): LineItem => {
  return {
    id: item.id,
    productId: item.rowid_products || '',
    description: item.product_name || 'Unknown Product',
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unit_price) || 0,
    total: Number(item.total) || 0,
    productDetails: item.productDetails
  };
};

/**
 * Map database gl_accounts to Account type
 */
export const mapGlAccountToAccount = (glAccount: GlAccount): Account => {
  return {
    id: glAccount.id,
    name: glAccount.account_name || 'Unnamed Account',
    type: mapAccountType(glAccount.client_type || 'customer'),
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
 * Map database gl_invoices to Invoice type
 */
export const mapGlInvoiceToInvoice = (
  glInvoice: GlInvoice, 
  accountName: string,
  lineItems: GlInvoiceLine[],
  payments: GlCustomerPayment[]
): Invoice => {
  const mappedLineItems = lineItems.map(mapToLineItem);
  const subtotal = mappedLineItems.reduce((sum, item) => sum + item.total, 0);
  
  const mappedPayments = payments.map((payment): Payment => ({
    id: payment.id,
    date: new Date(payment.date_of_payment || payment.created_at),
    amount: Number(payment.payment_amount) || 0,
    method: payment.type_of_payment,
    notes: payment.payment_note
  }));

  const amountPaid = mappedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  return {
    id: glInvoice.id,
    number: glInvoice.glide_row_id,
    date: new Date(glInvoice.created_timestamp || glInvoice.created_at),
    dueDate: glInvoice.invoice_order_date ? new Date(glInvoice.invoice_order_date) : undefined,
    accountId: glInvoice.rowid_accounts,
    accountName: accountName,
    subtotal: subtotal,
    tax: 0, // Would need to be calculated based on tax rate if available
    total: subtotal,
    notes: glInvoice.notes || '',
    lineItems: mappedLineItems,
    status: amountPaid >= subtotal ? 'paid' : amountPaid > 0 ? 'partial' : 'sent',
    balance: subtotal - amountPaid,
    amountPaid: amountPaid,
    payments: mappedPayments,
    createdAt: new Date(glInvoice.created_at),
    updatedAt: new Date(glInvoice.updated_at)
  };
};

/**
 * Map database gl_purchase_orders to PurchaseOrder type
 */
export const mapGlPurchaseOrderToPurchaseOrder = (
  glPurchaseOrder: GlPurchaseOrder, 
  accountName: string,
  lineItems: any[],
  payments: GlVendorPayment[]
): PurchaseOrder => {
  const mappedLineItems = lineItems.map(item => ({
    id: item.id,
    productId: item.rowid_products || '',
    description: item.product_name || 'Unknown Product',
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unit_price) || 0,
    total: Number(item.total) || 0,
    productDetails: item.productDetails
  }));
  
  const subtotal = mappedLineItems.reduce((sum, item) => sum + item.total, 0);
  const amountPaid = payments.reduce((sum, payment) => sum + Number(payment.payment_amount), 0);
  
  return {
    id: glPurchaseOrder.id,
    number: glPurchaseOrder.purchase_order_uid || glPurchaseOrder.glide_row_id,
    date: new Date(glPurchaseOrder.po_date || glPurchaseOrder.created_at),
    dueDate: glPurchaseOrder.date_payment_date_mddyyyy ? new Date(glPurchaseOrder.date_payment_date_mddyyyy) : undefined,
    accountId: glPurchaseOrder.rowid_accounts,
    accountName: accountName,
    subtotal: subtotal,
    tax: 0, // Would need to be calculated based on tax rate if available
    total: subtotal,
    notes: '',
    lineItems: mappedLineItems,
    status: amountPaid >= subtotal ? 'complete' : amountPaid > 0 ? 'partial' : 'sent',
    balance: subtotal - amountPaid,
    amountPaid: amountPaid,
    vendorId: glPurchaseOrder.rowid_accounts,
    createdAt: new Date(glPurchaseOrder.created_at),
    updatedAt: new Date(glPurchaseOrder.updated_at)
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

export const mapAccountType = (accountType: string): "Customer" | "Vendor" | "Customer & Vendor" => {
  switch (accountType.toLowerCase()) {
    case 'customer':
      return 'Customer';
    case 'vendor':
      return 'Vendor';
    case 'both':
      return 'Customer & Vendor';
    default:
      return 'Customer'; // Default fallback
  }
};

export function getLegacyAccountType(type: string): 'Customer' | 'Vendor' | 'Customer & Vendor' {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('customer') && normalizedType.includes('vendor')) {
    return 'Customer & Vendor';
  } else if (normalizedType.includes('customer')) {
    return 'Customer';
  } else if (normalizedType.includes('vendor')) {
    return 'Vendor';
  }
  return 'Customer'; // Default case
}
