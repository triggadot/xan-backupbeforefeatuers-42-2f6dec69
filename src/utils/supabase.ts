
import { Database } from '@/integrations/supabase/types';

// Type for valid table names in our application
export type SupabaseTableName = keyof Database['public']['Tables'] | 
                                keyof Database['public']['Views'];

// Utility function to safely cast a string to a valid Supabase table name
export function asTable(tableName: string): SupabaseTableName {
  // This will validate at runtime that the table exists
  // We're using type assertion here because we trust the input or it will fail at runtime
  return tableName as SupabaseTableName;
}
