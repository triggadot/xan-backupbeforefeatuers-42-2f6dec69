
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestResponse } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

// Define simple types to prevent deep instantiation issues
type TableRecord = Record<string, any>;
type RecordId = string | number;

export function useEntityOperations<T extends TableRecord>(tableName: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all records with optional filters
  const fetchAll = async (filters?: Record<string, any>): Promise<T[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from(tableName)
        .select('*');
        
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }
      
      const { data, error: apiError } = await query;
      
      if (apiError) {
        throw apiError;
      }
      
      return data as T[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch a single record by ID
  const fetchById = async (id: RecordId): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
        
      if (apiError) {
        throw apiError;
      }
      
      return data as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new record
  const create = async (data: Partial<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: newRecord, error: apiError } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
        
      if (apiError) {
        throw apiError;
      }
      
      toast({
        title: 'Success',
        description: 'Record created successfully',
      });
      
      return newRecord as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while creating data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing record
  const update = async (id: RecordId, data: Partial<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: updatedRecord, error: apiError } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
        
      if (apiError) {
        throw apiError;
      }
      
      toast({
        title: 'Success',
        description: 'Record updated successfully',
      });
      
      return updatedRecord as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a record
  const remove = async (id: RecordId): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: apiError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
        
      if (apiError) {
        throw apiError;
      }
      
      toast({
        title: 'Success',
        description: 'Record deleted successfully',
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    isLoading,
    error
  };
}
