
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TableDataOptions {
  page?: number;
  pageSize?: number;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useTableData<T = any>(tableName: string) {
  const [data, setData] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async (options: TableDataOptions = {}) => {
    const {
      page = 1,
      pageSize = 20,
      filters = {},
      sortBy,
      sortOrder = 'desc'
    } = options;

    setIsLoading(true);
    setError(null);

    try {
      // Calculate pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Start building query
      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string' && value.includes('%')) {
            query = query.ilike(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Apply sorting
      if (sortBy) {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      }

      // Apply pagination
      query = query.range(from, to);

      // Execute query
      const { data, error, count } = await query;

      if (error) throw error;

      setData(data || []);
      setTotalCount(count || 0);
      return { data, count };
    } catch (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching data';
      setError(errorMessage);
      
      toast({
        title: 'Data Fetch Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return { data: [], count: 0 };
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => fetchData();

  return {
    data,
    totalCount,
    isLoading,
    error,
    fetchData,
    refresh
  };
}
