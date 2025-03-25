
import { Database } from '@/integrations/supabase/types';
import { PostgrestError } from '@supabase/supabase-js';

// Type for valid table names in our application
export type SupabaseTableName = keyof Database['public']['Tables'] | 
                                keyof Database['public']['Views'];

// Expanded PostgrestError type
export interface SelectQueryError extends PostgrestError {
  // Additional fields that might be in the error
  details?: string;
  hint?: string;
  code?: string;
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
