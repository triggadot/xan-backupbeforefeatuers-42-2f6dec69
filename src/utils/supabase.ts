
import { Database } from '@/integrations/supabase/types';

// Define table names as a type for type safety
export type SupabaseTableName = string;

// Type-safe way to convert a SupabaseTableName to a string
export function asTable(tableName: SupabaseTableName): string {
  return tableName as string;
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
