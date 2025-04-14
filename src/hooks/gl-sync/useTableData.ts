import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { TableName, TableTypeMap } from '@/types/glsync.unified';

// This is needed for TypeScript compatibility with Supabase
// @ts-ignore - Supabase client type compatibility
const supabaseAny: any = supabase;

/**
 * Valid table names in the Supabase database
 * Includes both actual tables and views
 */

/**
 * Hook for interacting with Supabase tables with CRUD operations
 * 
 * @template T - Type of the records in the table
 * @param {TableName} tableName - The Supabase table to operate on
 * @returns {Object} Object containing data and CRUD operations
 * @property {T[]} data - The current data from the table
 * @property {boolean} isLoading - Whether data is currently being fetched
 * @property {string|null} error - Error message if an operation failed
 * @property {Function} fetchData - Function to fetch data with optional filters
 * @property {Function} createRecord - Function to create a new record
 * @property {Function} updateRecord - Function to update an existing record
 * @property {Function} deleteRecord - Function to delete a record
 * 
 * @example
 * ```tsx
 * const { 
 *   data, 
 *   isLoading, 
 *   fetchData, 
 *   createRecord, 
 *   updateRecord, 
 *   deleteRecord 
 * } = useTableData<Product>('gl_products');
 * 
 * // Fetch data with filters
 * useEffect(() => {
 *   fetchData({ active: true });
 * }, [fetchData]);
 * 
 * // Create a new record
 * const handleCreate = async () => {
 *   await createRecord({ name: 'New Product', price: 99.99 });
 * };
 * ```
 */
/**
 * Generic hook for interacting with Supabase tables with CRUD operations
 * This implementation uses a workaround for strict TypeScript compatibility
 * by using a type assertion on the Supabase client itself
 * 
 * @template T - Type of the records in the table (defaults to the correct type from TableTypeMap)
 * @param tableName - The Supabase table to interact with
 */
export function useTableData<T extends Record<string, any> = TableTypeMap[TableName]>(
  tableName: TableName
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fetch data from the specified table with optional filters
   * 
   * @param {Record<string, any>} filters - Optional key-value pairs to filter the data
   * @param {Object} options - Additional options for the query
   * @param {string[]} options.select - Specific columns to select
   * @param {number} options.limit - Maximum number of records to return
   * @param {number} options.offset - Number of records to skip
   * @param {string} options.orderBy - Column to order by
   * @param {boolean} options.ascending - Whether to order in ascending order
   * @returns {Promise<T[]>} The fetched data
   */
  const fetchData = useCallback(async (
    filters?: Record<string, any>,
    options?: {
      select?: string[];
      limit?: number;
      offset?: number;
      orderBy?: string;
      ascending?: boolean;
    }
  ): Promise<T[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the any-typed client to avoid TypeScript errors
      let query = supabaseAny.from(tableName).select(
        options?.select ? options.select.join(', ') : '*'
      );

      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply pagination if provided
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      // Apply ordering if provided
      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options?.ascending ?? true,
        });
      }

      const { data: responseData, error: responseError } = await query;

      if (responseError) {
        throw responseError;
      }

      // Handle conversion from supabase response to expected type safely
      // We use double casting to avoid type errors - first to unknown, then to the expected type
      const typedData = responseData as unknown as T[];
      setData(typedData);
      return typedData;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch data';
      setError(errorMessage);
      toast({
        title: 'Error fetching data',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [tableName, toast]);

  /**
   * Create a new record in the table
   * 
   * @param {Partial<T>} record - The record data to create
   * @returns {Promise<T|null>} The created record or null if creation failed
   */
  const createRecord = useCallback(async (record: Partial<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: newRecord, error: createError } = await supabaseAny
        .from(tableName)
        .insert(record)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      const typedRecord = newRecord as unknown as T;
      setData(prevData => [...prevData, typedRecord]);
      toast({
        title: 'Record created',
        description: 'The record was created successfully.',
      });
      return typedRecord;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create record';
      setError(errorMessage);
      toast({
        title: 'Error creating record',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [tableName, toast]);

  /**
   * Update an existing record in the table
   * 
   * @param {string|number} id - The ID of the record to update
   * @param {Partial<T>} updates - The fields to update
   * @returns {Promise<T|null>} The updated record or null if update failed
   */
  const updateRecord = useCallback(async (
    id: string | number,
    updates: Partial<T>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: updatedRecord, error: updateError } = await supabaseAny
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const typedRecord = updatedRecord as unknown as T;
      setData(prevData =>
        prevData.map(item =>
          (item as any).id === id ? typedRecord : item
        )
      );
      toast({
        title: 'Record updated',
        description: 'The record was updated successfully.',
      });
      return typedRecord;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update record';
      setError(errorMessage);
      toast({
        title: 'Error updating record',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [tableName, toast]);

  /**
   * Delete a record from the table
   * 
   * @param {string|number} id - The ID of the record to delete
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  const deleteRecord = useCallback(async (id: string | number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabaseAny
        .from(tableName)
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setData(prevData => prevData.filter(item => (item as any).id !== id));
      toast({
        title: 'Record deleted',
        description: 'The record was deleted successfully.',
      });
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete record';
      setError(errorMessage);
      toast({
        title: 'Error deleting record',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [tableName, toast]);

  return {
    data,
    isLoading,
    error,
    fetchData,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}
