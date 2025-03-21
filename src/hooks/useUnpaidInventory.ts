
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
      // Fetch samples from a view or table directly rather than using an RPC
      const { data: sampleData, error: sampleError } = await supabase
        .from('mv_unpaid_samples')
        .select('*');

      if (sampleError) {
        throw new Error(`Error fetching sample data: ${sampleError.message}`);
      }

      // Fetch fronted products from a view or table
      const { data: frontedData, error: frontedError } = await supabase
        .from('mv_unpaid_fronted')
        .select('*');

      if (frontedError) {
        throw new Error(`Error fetching fronted data: ${frontedError.message}`);
      }

      // Process sample data
      if (sampleData && Array.isArray(sampleData)) {
        sampleData.forEach(item => {
          samples.push({
            id: item.id || '',
            product_id: item.product_id || '',
            product_name: item.product_name || '',
            name: item.product_name || '', // Map for component compatibility
            quantity: Number(item.quantity) || 0,
            unpaid_value: Number(item.unpaid_value) || 0,
            unpaid_type: 'Sample',
            date_created: item.date_created || item.created_at || '',
            customer_name: item.customer_name || '',
            customer_id: item.customer_id || '',
            vendor_name: item.vendor_name || '',
            cost: Number(item.cost) || 0,
            glide_row_id: item.glide_row_id || item.id || '',
            inventory_value: Number(item.inventory_value) || 0,
            payment_status: item.payment_status || 'unpaid'
          });
        });
      }

      // Process fronted products data
      if (frontedData && Array.isArray(frontedData)) {
        frontedData.forEach(item => {
          frontedProducts.push({
            id: item.id || '',
            product_id: item.product_id || '',
            product_name: item.product_name || '',
            name: item.product_name || '', // Map for component compatibility
            quantity: Number(item.quantity) || 0,
            unpaid_value: Number(item.unpaid_value) || 0,
            unpaid_type: 'Fronted',
            date_created: item.date_created || item.created_at || '',
            customer_name: item.customer_name || '',
            customer_id: item.customer_id || '',
            vendor_name: item.vendor_name || '',
            cost: Number(item.cost) || 0,
            terms_for_fronted_product: item.terms_for_fronted_product || '',
            glide_row_id: item.glide_row_id || item.id || '',
            inventory_value: Number(item.inventory_value) || 0,
            payment_status: item.payment_status || 'unpaid'
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
      const product = unpaidProducts.find(p => p.glide_row_id === productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Update the appropriate table based on product type
      let result;
      if (product.unpaid_type === 'Sample') {
        result = await supabase
          .from('gl_samples')
          .update({ paid: true })
          .eq('glide_row_id', productId);
      } else {
        result = await supabase
          .from('gl_fronted_products')
          .update({ paid: true })
          .eq('glide_row_id', productId);
      }
      
      if (result.error) throw result.error;
      
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
      const product = unpaidProducts.find(p => p.glide_row_id === productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Update the appropriate table based on product type
      let result;
      if (product.unpaid_type === 'Sample') {
        result = await supabase
          .from('gl_samples')
          .update({ returned: true })
          .eq('glide_row_id', productId);
      } else {
        result = await supabase
          .from('gl_fronted_products')
          .update({ returned: true })
          .eq('glide_row_id', productId);
      }
      
      if (result.error) throw result.error;
      
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
