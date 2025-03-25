
// Helper type guard to check if an object has a specific property
export function hasProperty<K extends string>(obj: unknown, prop: K): obj is { [P in K]: unknown } {
  return obj !== null && 
         typeof obj === 'object' && 
         prop in obj;
}

// Type guard to check if a value is a record/object
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Generic Database Row Type - base interface for database rows
export interface DatabaseRow {
  id?: string | number;
  created_at?: string;
  updated_at?: string;
}

// Product Row Type - represents rows from gl_products and mv_product_vendor_details
export interface ProductRow extends DatabaseRow {
  glide_row_id?: string;
  product_id?: string;
  display_name?: string;
  new_product_name?: string;
  vendor_product_name?: string;
  cost?: number | string;
  total_qty_purchased?: number | string;
  category?: string;
  product_image1?: string;
  purchase_notes?: string;
  rowid_accounts?: string;
  product_purchase_date?: string;
  po_po_date?: string;
  samples?: boolean;
  fronted?: boolean;
  samples_or_fronted?: boolean;
  miscellaneous_items?: boolean;
  terms_for_fronted_product?: string;
  total_units_behind_sample?: number | string;
  vendor_name?: string;
  vendor_id?: string;
  vendor_uid?: string;
  vendor_glide_id?: string;
  product_glide_id?: string;
  po_number?: string;
  po_date?: string;
  po_status?: string;
  vendor?: Record<string, unknown> | string;
  [key: string]: unknown; // Allow additional properties
}

// Invoice Row Type - represents rows from gl_invoices and mv_invoice_customer_details
export interface InvoiceRow extends DatabaseRow {
  glide_row_id?: string;
  rowid_accounts?: string;
  total_amount?: number | string;
  balance?: number | string;
  total_paid?: number | string;
  payment_status?: string;
  invoice_order_date?: string;
  due_date?: string;
  tax_rate?: number | string;
  tax_amount?: number | string;
  notes?: string;
  customer_name?: string;
  customer_id?: string;
  customer_uid?: string;
  customer?: Record<string, unknown> | string;
  line_item_count?: number;
  line_items_total?: number;
  payments_total?: number;
  [key: string]: unknown; // Allow additional properties
}

// Purchase Order Row Type - represents rows from gl_purchase_orders and mv_purchase_order_vendor_details
export interface PurchaseOrderRow extends DatabaseRow {
  glide_row_id?: string;
  purchase_order_uid?: string;
  rowid_accounts?: string;
  po_date?: string;
  payment_status?: string;
  total_amount?: number | string;
  balance?: number | string;
  total_paid?: number | string;
  product_count?: number;
  product_count_calc?: number;
  docs_shortlink?: string;
  vendor_name?: string;
  vendor_id?: string;
  vendor_uid?: string;
  vendor?: Record<string, unknown> | string;
  products_total?: number;
  payments_total?: number;
  date_payment_date_mddyyyy?: string;
  [key: string]: unknown; // Allow additional properties
}

// Generic QueryResult type for Supabase queries
export type QueryResult<T> = T | null;

// Helper function to safely transform number fields
export function asNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

// Helper function to safely transform boolean fields
export function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value !== 0;
  return false;
}

// Helper function to safely transform date fields
export function asDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

// Helper function to safely access a nested property
export function getNestedProperty<T>(obj: unknown, path: string, defaultValue: T): T {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current !== undefined && current !== null ? current as T : defaultValue;
}

// Parse JSON if it's a string, otherwise return as is
export function parseJsonIfString<T>(value: unknown): T | null {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      return null;
    }
  }
  return value as T | null;
}
