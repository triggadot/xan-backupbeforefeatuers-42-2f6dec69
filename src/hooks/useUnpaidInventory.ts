
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define types for unpaid product data
export interface UnpaidProduct {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unpaid_value: number;
  unpaid_type: 'Sample' | 'Fronted';
  date_created: string;
  customer_name?: string;
  customer_id?: string;
  rawData?: any;
}

export const useUnpaidInventory = () => {
  const [unpaidProducts, setUnpaidProducts] = useState<UnpaidProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all unpaid inventory (samples and fronted products)
  const fetchUnpaidInventory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First get unpaid samples
      const { data: samples, error: samplesError } = await supabase
        .from('mv_unpaid_samples')
        .select('*');
        
      if (samplesError) throw samplesError;
      
      // Then get fronted products
      const { data: fronted, error: frontedError } = await supabase
        .from('mv_unpaid_fronted')
        .select('*');
        
      if (frontedError) throw frontedError;
      
      // Map and combine the results
      const mappedProducts: UnpaidProduct[] = [
        ...(samples || []).map((sample): UnpaidProduct => ({
          id: sample.id,
          product_id: sample.product_id,
          product_name: sample.product_name || 'Unknown Product',
          quantity: Number(sample.quantity) || 0,
          unpaid_value: Number(sample.unpaid_value) || 0,
          unpaid_type: 'Sample',
          date_created: sample.date_created,
          customer_name: sample.customer_name,
          customer_id: sample.customer_id,
          rawData: sample
        })),
        ...(fronted || []).map((item): UnpaidProduct => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name || 'Unknown Product',
          quantity: Number(item.quantity) || 0,
          unpaid_value: Number(item.unpaid_value) || 0,
          unpaid_type: 'Fronted',
          date_created: item.date_created,
          customer_name: item.customer_name,
          customer_id: item.customer_id,
          rawData: item
        }))
      ];
      
      setUnpaidProducts(mappedProducts);
    } catch (err) {
      console.error('Error fetching unpaid inventory:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      toast({
        title: "Error",
        description: "Failed to load unpaid inventory data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mark a product as paid
  const markAsPaid = async (productId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const product = unpaidProducts.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      if (product.unpaid_type === 'Sample') {
        // Update the sample as paid
        const { error } = await supabase
          .from('gl_samples')
          .update({ paid: true })
          .eq('id', productId);
          
        if (error) throw error;
      } else {
        // Update the fronted product as paid
        const { error } = await supabase
          .from('gl_fronted_products')
          .update({ paid: true })
          .eq('id', productId);
          
        if (error) throw error;
      }
      
      // Refresh the list
      await fetchUnpaidInventory();
      
      toast({
        title: "Success",
        description: `${product.product_name} marked as paid.`,
      });
    } catch (err) {
      console.error('Error marking product as paid:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      toast({
        title: "Error",
        description: "Failed to mark product as paid.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mark a product as returned
  const markAsReturned = async (productId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const product = unpaidProducts.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      if (product.unpaid_type === 'Sample') {
        // Update the sample as returned
        const { error } = await supabase
          .from('gl_samples')
          .update({ returned: true })
          .eq('id', productId);
          
        if (error) throw error;
      } else {
        // Update the fronted product as returned
        const { error } = await supabase
          .from('gl_fronted_products')
          .update({ returned: true })
          .eq('id', productId);
          
        if (error) throw error;
      }
      
      // Refresh the list
      await fetchUnpaidInventory();
      
      toast({
        title: "Success",
        description: `${product.product_name} marked as returned.`,
      });
    } catch (err) {
      console.error('Error marking product as returned:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      toast({
        title: "Error",
        description: "Failed to mark product as returned.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    unpaidProducts,
    isLoading,
    error,
    fetchUnpaidInventory,
    markAsPaid,
    markAsReturned
  };
};
