
import { Database } from '@/integrations/supabase/types';

// Define table names as a type for type safety
export type SupabaseTableName = keyof (Database['public']['Tables'] & Database['public']['Views']);

// Extract row type from a table name
export type TableRow<T extends SupabaseTableName> = Database['public']['Tables'][T extends keyof Database['public']['Tables'] ? T : never]['Row'];

// Generic record type with an ID
export interface EntityRecord {
  id: string | number;
  [key: string]: any;
}
