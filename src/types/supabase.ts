
// Helper type guard to check if an object has a specific property
export function hasProperty<K extends string>(obj: unknown, prop: K): obj is { [P in K]: unknown } {
  return obj !== null && 
         typeof obj === 'object' && 
         prop in obj;
}

// Define types for SelectQueryError that might come from a query
export type SelectQueryError<T> = T | null;
