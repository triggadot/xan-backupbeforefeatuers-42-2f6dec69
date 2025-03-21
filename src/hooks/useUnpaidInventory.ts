
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

    try {
      // Fetch from the gl_unpaid_inventory view which already has all the data we need
      const { data, error: fetchError } = await supabase
        .from('gl_unpaid_inventory')
        .select('*');

      if (fetchError) throw new Error(`Error fetching unpaid inventory: ${fetchError.message}`);

      if (data && Array.isArray(data)) {
        // Transform the data to match our UnpaidProduct type
        const transformedProducts: UnpaidProduct[] = data.map(item => ({
          id: item.id || '',
          product_id: item.id || '',
          product_name: item.display_name || item.new_product_name || item.vendor_product_name || '',
          name: item.display_name || item.new_product_name || item.vendor_product_name || '', // For component compatibility
          quantity: Number(item.total_qty_purchased) || 0,
          unpaid_value: Number(item.unpaid_value) || 0,
          unpaid_type: item.unpaid_type || 'Sample',
          date_created: item.created_at || '',
          customer_name: item.vendor_name || '',
          customer_id: item.rowid_accounts || '',
          vendor_name: item.vendor_name || '',
          cost: Number(item.cost) || 0,
          terms_for_fronted_product: item.terms_for_fronted_product || '',
          glide_row_id: item.glide_row_id || item.id || '',
          inventory_value: Number(item.total_qty_purchased) * Number(item.cost) || 0,
          payment_status: 'unpaid'
        }));

        setUnpaidProducts(transformedProducts);
      }
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
      const tableName = product.unpaid_type === 'Sample' ? 'gl_samples' : 'gl_fronted_products';
      
      const { error: updateError } = await supabase.rpc('gl_update_product_payment_status', {
        product_id: productId,
        new_status: 'Paid'
      });
      
      if (updateError) throw updateError;
      
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
      
      // Use the database function to mark as returned
      const { error: updateError } = await supabase.rpc('gl_update_product_payment_status', {
        product_id: productId,
        new_status: 'Returned'
      });
      
      if (updateError) throw updateError;
      
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
