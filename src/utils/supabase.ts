
import { Database } from '@/integrations/supabase/types';

// Define a union type for all valid Supabase table names for better type safety
export type SupabaseTableName = 
  | 'gl_accounts'
  | 'gl_connections'
  | 'gl_customer_credits'
  | 'gl_customer_payments'
  | 'gl_estimate_lines'
  | 'gl_estimates'
  | 'gl_expenses'
  | 'gl_invoice_lines'
  | 'gl_invoices'
  | 'gl_mappings'
  | 'gl_products'
  | 'gl_purchase_orders'
  | 'gl_shipping_records'
  | 'gl_sync_errors'
  | 'gl_sync_logs'
  | 'gl_vendor_payments'
  | 'profiles';

// Convert a string to a SupabaseTableName if it's a valid table name
export function asTable(tableName: string): SupabaseTableName {
  const validTables = [
    'gl_accounts', 'gl_connections', 'gl_customer_credits', 'gl_customer_payments',
    'gl_estimate_lines', 'gl_estimates', 'gl_expenses', 'gl_invoice_lines',
    'gl_invoices', 'gl_mappings', 'gl_products', 'gl_purchase_orders',
    'gl_shipping_records', 'gl_sync_errors', 'gl_sync_logs', 'gl_vendor_payments',
    'profiles'
  ];
  
  if (!validTables.includes(tableName)) {
    console.warn(`Table name '${tableName}' might not be valid. Please check.`);
  }
  
  return tableName as SupabaseTableName;
}

// Type guard to check if a value is an object with an ID
export function hasId(value: unknown): value is { id: string } {
  return value !== null && 
    typeof value === 'object' && 
    'id' in value &&
    typeof (value as { id: string }).id === 'string';
}

// Type assertion helper for casting database results
export function asRecord<T>(value: unknown): T {
  return value as T;
}

// Safely access a nested property if it exists
export function getNestedProperty<T, K extends string>(obj: T, key: K): any | undefined {
  if (obj && typeof obj === 'object' && key in obj) {
    return (obj as any)[key];
  }
  return undefined;
}

// Type guard to check if an array only contains objects with IDs
export function isRecordArray(values: unknown[]): values is { id: string }[] {
  return values.every(hasId);
}

// Type assertion helper for casting database result arrays
export function asRecordArray<T>(values: unknown[]): T[] {
  return values as T[];
}
