
import { Database } from '@/integrations/supabase/types';

// Define table names as a union type for type safety
export type SupabaseTableName = keyof Database['public']['Tables'] | keyof Database['public']['Views'];

// Define a string literal type for direct table access (used by supabase client)
export type DirectTableAccess = string;

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

// Type assertion helper for casting database results to the expected type
export function asEntityRecord<T extends EntityRecord>(value: unknown): T {
  if (!isEntityRecord(value)) {
    throw new Error('Value is not a valid EntityRecord');
  }
  return value as T;
}

// Type guard to check if an array only contains EntityRecords
export function isEntityRecordArray(values: unknown[]): values is EntityRecord[] {
  return values.every(isEntityRecord);
}

// Type assertion helper for casting database results array to the expected type array
export function asEntityRecordArray<T extends EntityRecord>(values: unknown[]): T[] {
  if (!Array.isArray(values) || !values.every(isEntityRecord)) {
    throw new Error('Values array contains non-EntityRecord items');
  }
  return values as T[];
}

// Helper to safely cast to any table to avoid TypeScript errors with Supabase client
export function asTable(tableName: SupabaseTableName): DirectTableAccess {
  return tableName as string;
}
