import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Fetch all product categories from the database
 */
const fetchCategories = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .rpc('gl_get_product_categories');
    
  if (error) {
    throw new Error(`Error fetching categories: ${error.message}`);
  }
  
  return data || [];
};

/**
 * Hook to fetch product categories
 */
export const useCategories = () => {
  return useQuery<string[], Error>({
    queryKey: ['product-categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
