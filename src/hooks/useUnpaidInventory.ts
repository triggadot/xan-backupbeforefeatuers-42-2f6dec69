
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UnpaidProduct } from '@/types/product';

export function useUnpaidInventory() {
  const [unpaidProducts, setUnpaidProducts] = useState<UnpaidProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUnpaidInventory = async () => {
    setIsLoading(true);
    setError(null);
    const samples: UnpaidProduct[] = [];
    const frontedProducts: UnpaidProduct[] = [];

    try {
      // Fetch samples using a database function or view
      const { data: sampleData, error: sampleError } = await supabase
        .rpc('get_unpaid_samples');

      if (sampleError) {
        throw new Error(`Error fetching sample data: ${sampleError.message}`);
      }

      // Fetch fronted products using a database function or view
      const { data: frontedData, error: frontedError } = await supabase
        .rpc('get_unpaid_fronted');

      if (frontedError) {
        throw new Error(`Error fetching fronted data: ${frontedError.message}`);
      }

      // Process sample data
      if (sampleData && Array.isArray(sampleData)) {
        sampleData.forEach(item => {
          samples.push({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: Number(item.quantity),
            unpaid_value: Number(item.unpaid_value),
            unpaid_type: 'Sample',
            date_created: item.date_created,
            customer_name: item.customer_name,
            customer_id: item.customer_id
          });
        });
      }

      // Process fronted products data
      if (frontedData && Array.isArray(frontedData)) {
        frontedData.forEach(item => {
          frontedProducts.push({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: Number(item.quantity),
            unpaid_value: Number(item.unpaid_value),
            unpaid_type: 'Fronted',
            date_created: item.date_created,
            customer_name: item.customer_name,
            customer_id: item.customer_id
          });
        });
      }

      // Combine both types of products
      setUnpaidProducts([...samples, ...frontedProducts]);
    } catch (err) {
      console.error('Error fetching unpaid inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch unpaid inventory');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch unpaid inventory',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsPaid = async (productId: string): Promise<boolean> => {
    try {
      // Find the product to determine its type
      const product = unpaidProducts.find(p => p.product_id === productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Update the appropriate table based on product type
      if (product.unpaid_type === 'Sample') {
        const { error } = await supabase.rpc('update_sample_paid_status', {
          product_id: productId,
          paid_status: true
        });
        
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('update_fronted_paid_status', {
          product_id: productId,
          paid_status: true
        });
        
        if (error) throw error;
      }
      
      // Refresh product list
      await fetchUnpaidInventory();
      
      toast({
        title: 'Success',
        description: 'Product marked as paid successfully.',
      });
      
      return true;
    } catch (err) {
      console.error('Error marking product as paid:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to mark product as paid',
        variant: 'destructive',
      });
      return false;
    }
  };

  const markAsReturned = async (productId: string): Promise<boolean> => {
    try {
      // Find the product to determine its type
      const product = unpaidProducts.find(p => p.product_id === productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Update the appropriate table based on product type
      if (product.unpaid_type === 'Sample') {
        const { error } = await supabase.rpc('update_sample_returned_status', {
          product_id: productId,
          returned_status: true
        });
        
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('update_fronted_returned_status', {
          product_id: productId,
          returned_status: true
        });
        
        if (error) throw error;
      }
      
      // Refresh product list
      await fetchUnpaidInventory();
      
      toast({
        title: 'Success',
        description: 'Product marked as returned successfully.',
      });
      
      return true;
    } catch (err) {
      console.error('Error marking product as returned:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to mark product as returned',
        variant: 'destructive',
      });
      return false;
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
}
