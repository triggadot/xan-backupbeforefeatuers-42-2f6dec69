
import { Database } from '@/integrations/supabase/types';
import { PostgrestError } from '@supabase/supabase-js';

// Type for valid table names in our application
export type SupabaseTableName = keyof Database['public']['Tables'] | 
                                keyof Database['public']['Views'];

// Expanded PostgrestError type without extending PostgrestError
export interface SelectQueryError {
  // Core PostgrestError properties
  message: string;
  code?: string;
  hint?: string;
  details?: string;
}

// Utility function to safely cast a string to a valid Supabase table name
export function asTable(tableName: string): SupabaseTableName {
  // This will validate at runtime that the table exists
  // We're using type assertion here because we trust the input or it will fail at runtime
  return tableName as SupabaseTableName;
}

// Type guard to check if value is Json (Supabase JSON response)
export function isJsonValue(value: unknown): value is Record<string, unknown> | string | number | boolean | null {
  return value !== undefined;
}

// Type guard to check if a value can be safely used as a Record
export function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Type guard to check if an object has a specific property
export function hasProperty<K extends string>(obj: unknown, prop: K): obj is { [P in K]: unknown } {
  return isJsonRecord(obj) && prop in obj;
}

// Helper functions for type conversion
export function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

export function asNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
}

export function asDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

// Product row from database
export interface ProductRow {
  id?: string | number;
  glide_row_id?: string;
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
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// Materialized view product row - adding the fields used in materialized views
export interface ProductViewRow extends ProductRow {
  vendor_name?: string;
  vendor_id?: string;
  vendor_uid?: string;
  vendor_glide_id?: string;
  product_id?: string;
  product_glide_id?: string;
}

// Raw purchase order row
export interface PurchaseOrderRow {
  id?: string;
  glide_row_id?: string;
  purchase_order_uid?: string;
  rowid_accounts?: string;
  po_date?: string;
  created_at?: string;
  updated_at?: string;
  payment_status?: string;
  total_amount?: number | string;
  total_paid?: number | string;
  balance?: number | string;
  product_count?: number | string;
  // This can be a complex object, so we use a union type
  vendor?: string | Record<string, unknown> | null;
  [key: string]: unknown;
}

// Invoice row from database
export interface InvoiceRow {
  id?: string;
  glide_row_id?: string;
  invoice_order_date?: string;
  rowid_accounts?: string;
  created_at?: string;
  updated_at?: string;
  payment_status?: string;
  total_amount?: number | string;
  total_paid?: number | string;
  balance?: number | string;
  // This can be a complex object, so we use a union type
  customer?: string | Record<string, unknown> | null;
  [key: string]: unknown;
}
