
import { PostgrestError } from '@supabase/supabase-js';

export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: PostgrestError | Error,
    public entityType?: string,
    public operationType?: 'create' | 'read' | 'update' | 'delete'
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const handleDatabaseError = (
  error: PostgrestError | Error | unknown,
  entityType: string,
  operation: 'create' | 'read' | 'update' | 'delete'
): DatabaseError => {
  const message = error instanceof Error ? error.message : 'Unknown database error';
  return new DatabaseError(
    `Failed to ${operation} ${entityType}: ${message}`,
    error instanceof Error ? error : undefined,
    entityType,
    operation
  );
};

export const errorToast = (error: Error | unknown) => {
  const message = error instanceof Error ? error.message : 'An unknown error occurred';
  return {
    title: 'Error',
    description: message,
    variant: 'destructive' as const
  };
};
