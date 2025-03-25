
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EntityOperationsConfig {
  tableName: string;
  entityName: string;
}

/**
 * A reusable hook for common entity operations (fetch, create, update, delete)
 */
export function useEntityOperations<T>({ tableName, entityName }: EntityOperationsConfig) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEntities = useCallback(async (filters?: Record<string, any>) => {
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
            } else if (typeof value === 'string' && value.includes('%')) {
              query = query.ilike(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }
      
      const { data, error: fetchError } = await query
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      return { data: data as T[], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error fetching ${entityName}`;
      setError(errorMessage);
      console.error(`Error in useEntityOperations.fetchEntities for ${entityName}:`, err);
      
      toast({
        title: `Error fetching ${entityName}`,
        description: errorMessage,
        variant: "destructive"
      });
      
      return { data: [], error: err };
    } finally {
      setIsLoading(false);
    }
  }, [tableName, entityName, toast]);
  
  const getEntity = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      return data as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error fetching ${entityName}`;
      setError(errorMessage);
      console.error(`Error in useEntityOperations.getEntity for ${entityName}:`, err);
      
      toast({
        title: `Error fetching ${entityName}`,
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [tableName, entityName, toast]);
  
  const createEntity = useCallback(async (data: Partial<T>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: newEntity, error: createError } = await supabase
        .from(tableName)
        .insert([data])
        .select()
        .single();
      
      if (createError) throw createError;
      
      toast({
        title: `${entityName} Created`,
        description: `New ${entityName.toLowerCase()} has been created successfully.`
      });
      
      return newEntity as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error creating ${entityName}`;
      setError(errorMessage);
      console.error(`Error in useEntityOperations.createEntity for ${entityName}:`, err);
      
      toast({
        title: `Error creating ${entityName}`,
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [tableName, entityName, toast]);
  
  const updateEntity = useCallback(async (id: string, data: Partial<T>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: updatedEntity, error: updateError } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      toast({
        title: `${entityName} Updated`,
        description: `${entityName} has been updated successfully.`
      });
      
      return updatedEntity as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error updating ${entityName}`;
      setError(errorMessage);
      console.error(`Error in useEntityOperations.updateEntity for ${entityName}:`, err);
      
      toast({
        title: `Error updating ${entityName}`,
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [tableName, entityName, toast]);
  
  const deleteEntity = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      toast({
        title: `${entityName} Deleted`,
        description: `${entityName} has been deleted successfully.`
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error deleting ${entityName}`;
      setError(errorMessage);
      console.error(`Error in useEntityOperations.deleteEntity for ${entityName}:`, err);
      
      toast({
        title: `Error deleting ${entityName}`,
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [tableName, entityName, toast]);
  
  return {
    fetchEntities,
    getEntity,
    createEntity,
    updateEntity,
    deleteEntity,
    isLoading,
    error
  };
}
