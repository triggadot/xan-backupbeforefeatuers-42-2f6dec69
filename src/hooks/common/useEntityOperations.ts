
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { asTable, SupabaseTableName } from '@/utils/supabase';

// Generic hook for basic CRUD operations on any entity
export function useEntityOperations<T extends { id: string }>(tableName: SupabaseTableName) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async (): Promise<T[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from(tableName as string)
        .select('*');
        
      if (fetchError) throw fetchError;
      
      // Use type assertion to handle the conversion
      return (data || []) as unknown as T[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error(`Error fetching ${tableName}:`, err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchById = async (id: string): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from(tableName as string)
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Use type assertion to handle the conversion
      return data as unknown as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error(`Error fetching ${tableName} by ID:`, err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const create = async (entity: Omit<T, 'id'>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: createError } = await supabase
        .from(tableName as string)
        .insert(entity)
        .select()
        .single();
        
      if (createError) throw createError;
      
      // Use type assertion to handle the conversion
      return data as unknown as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error(`Error creating ${tableName}:`, err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const update = async (id: string, updates: Partial<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: updateError } = await supabase
        .from(tableName as string)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      // Use type assertion to handle the conversion
      return data as unknown as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error(`Error updating ${tableName}:`, err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: deleteError } = await supabase
        .from(tableName as string)
        .delete()
        .eq('id', id);
        
      if (deleteError) throw deleteError;
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error(`Error deleting ${tableName}:`, err);
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
