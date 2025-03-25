
import { Database } from '@/integrations/supabase/types';

// Define table names as a type for type safety
export type SupabaseTableName = keyof (Database['public']['Tables'] & Database['public']['Views']);

// Extract row type from a table name
export type TableRow<T extends SupabaseTableName> = 
  T extends keyof Database['public']['Tables'] 
    ? Database['public']['Tables'][T]['Row'] 
    : T extends keyof Database['public']['Views'] 
      ? Database['public']['Views'][T]['Row'] 
      : never;

// Generic record type with an ID
export interface EntityRecord {
  id: string;
  [key: string]: any;
}

// Type guard to check if a value is an EntityRecord
export function isEntityRecord(value: unknown): value is EntityRecord {
  return (
    value !== null &&
    typeof value === 'object' &&
    'id' in value &&
    (typeof (value as EntityRecord).id === 'string')
  );
}

// Type guard for checking if a property exists and is not null/undefined
export function hasProperty<T, K extends string>(obj: T, key: K): obj is T & Record<K, unknown> {
  return obj !== null && typeof obj === 'object' && key in obj && (obj as any)[key] !== null && (obj as any)[key] !== undefined;
}
