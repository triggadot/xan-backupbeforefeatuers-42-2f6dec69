/**
 * Common utility functions and type definitions for PDF generation
 * These functions are consistent between frontend and edge functions
 */

/**
 * Format currency consistently across the application
 * @param amount Currency amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date consistently across the application
 * @param dateString Date string to format
 * @returns Formatted date string in format like "Jan 1, 2023"
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

/**
 * Format a date string to a short date format (MM/DD/YYYY)
 * @param dateString Date string to format
 * @returns Formatted date string or 'N/A' if date is invalid
 */
export function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error('Error formatting short date:', error);
    return 'N/A';
  }
}

/**
 * Account information shared across document types
 */
export interface Account {
  id: string;
  glide_row_id?: string;
  account_name?: string;
  account_uid?: string;
  account_address?: string;
  account_city?: string;
  account_state?: string;
  account_zip?: string;
  account_email?: string;
  account_phone?: string;
}

/**
 * Invoice line item information
 */
export interface InvoiceLine {
  id: string;
  glide_row_id?: string;
  product_name_display?: string;
  renamed_product_name?: string;
  quantity?: number;
  price?: number;
  total?: number;
  product?: {
    vendor_product_name?: string;
    new_product_name?: string;
  };
}

/**
 * Invoice document information
 */
export interface Invoice {
  id: string;
  glide_row_id?: string;
  invoice_uid?: string;
  invoice_order_date?: string;
  invoice_ship_date?: string;
  status?: string;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  shipping_cost?: number;
  invoice_notes?: string;
  payment_terms?: string;
  account?: Account;
  lines?: InvoiceLine[];
  customer_payments?: Array<{
    id: string;
    payment_amount?: number;
    date_of_payment?: string;
    type_of_payment?: string;
    payment_note?: string;
  }>;
}

/**
 * Purchase order line item information
 */
export interface PurchaseOrderLineItem {
  id: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  description?: string;
  productId?: string;
  product_name?: string;
  new_product_name?: string;
  vendor_product_name?: string;
  display_name?: string;
  unit_price?: number;
  notes?: string;
  samples?: boolean;
  fronted?: boolean;
  category?: string;
  total_units?: number;
}

/**
 * Purchase order document information
 */
export interface PurchaseOrder {
  id: string;
  glide_row_id?: string;
  purchase_order_uid?: string;
  po_date?: string;
  po_status?: string;
  po_notes?: string;
  shipping_cost?: number;
  total_amount?: number;
  balance?: number;
  account?: Account;
  lineItems?: PurchaseOrderLineItem[];
  vendorPayments?: Array<{
    id: string;
    amount?: number;
    date?: string;
    method?: string;
    notes?: string;
  }>;
}

/**
 * Estimate line item information
 */
export interface EstimateLine {
  id: string;
  glide_row_id?: string;
  product_name_display?: string;
  quantity?: number;
  price?: number;
  total?: number;
  product?: {
    vendor_product_name?: string;
    new_product_name?: string;
  };
}

/**
 * Estimate document information
 */
export interface Estimate {
  id: string;
  glide_row_id?: string;
  estimate_uid?: string;
  estimate_date?: string;
  status?: string;
  is_a_sample?: boolean;
  total_amount?: number;
  balance?: number;
  estimate_notes?: string;
  account?: Account;
  lines?: EstimateLine[];
  customer_credits?: Array<{
    id: string;
    payment_amount?: number;
    date_of_payment?: string;
    payment_type?: string;
    payment_note?: string;
  }>;
}

/**
 * Supported document types for PDF generation
 */
export type DocumentType = 'invoice' | 'purchaseOrder' | 'estimate';
