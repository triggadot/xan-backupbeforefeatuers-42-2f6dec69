
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UnpaidProduct } from '@/types/product';

export function useUnpaidInventory() {
  const [unpaidProducts, setUnpaidProducts] = useState<UnpaidProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUnpaidInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Query the unpaid inventory view
      const { data, error } = await supabase
        .from('mv_product_vendor_details')
        .select('*')
        .in('payment_status', ['Sample', 'Fronted']);

      if (error) throw error;

      // Map the database results to the UnpaidProduct type
      const formattedProducts: UnpaidProduct[] = (data || []).map((item: any): UnpaidProduct => ({
        id: item.product_id,
        glide_row_id: item.product_glide_id,
        name: item.display_name,
        display_name: item.display_name,
        new_product_name: item.new_product_name,
        vendor_product_name: item.vendor_product_name,
        sku: item.product_glide_id, // Using glide_row_id as SKU
        notes: item.purchase_notes,
        cost: item.cost,
        quantity: item.total_qty_purchased,
        category: item.category,
        product_image1: item.product_image1,
        vendor_name: item.vendor_name,
        // Update to use vendor_id instead of vendorId for UnpaidProduct type
        vendor_id: item.vendor_glide_id, 
        created_at: item.created_at || '',
        updated_at: item.updated_at || '',
        unpaid_type: item.payment_status as 'Sample' | 'Fronted',
        unpaid_value: item.payment_status === 'Sample' ? item.sample_value : item.fronted_value,
        samples: item.samples,
        fronted: item.fronted,
        miscellaneous_items: item.miscellaneous_items,
        product_purchase_date: item.product_purchase_date,
        terms_for_fronted_product: item.terms_for_fronted_product,
        total_units_behind_sample: item.total_units_behind_sample,
        total_qty_purchased: item.total_qty_purchased,
        payment_status: item.payment_status as 'Sample' | 'Fronted' | 'Paid',
        inventory_value: item.inventory_value,
        sample_value: item.sample_value,
        fronted_value: item.fronted_value
      }));

      setUnpaidProducts(formattedProducts);
    } catch (err) {
      console.error('Error fetching unpaid inventory:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching unpaid inventory');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    fetchUnpaidInventory();
  }, [fetchUnpaidInventory]);

  // Function to mark a product as paid
  const markAsPaid = async (productId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('gl_update_product_payment_status', {
        product_id: productId,
        new_status: 'Paid'
      });

      if (error) throw error;

      toast({
        title: 'Product marked as paid',
        description: 'The product has been updated successfully.',
      });

      // Refresh the list
      await fetchUnpaidInventory();
      return true;
    } catch (err) {
      console.error('Error marking product as paid:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update product status',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Function to mark a sample product as returned to vendor
  const markAsReturned = async (productId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('gl_update_product_payment_status', {
        product_id: productId,
        new_status: 'Returned'
      });

      if (error) throw error;

      toast({
        title: 'Sample returned to vendor',
        description: 'The sample has been marked as returned to the vendor.',
      });

      // Refresh the list
      await fetchUnpaidInventory();
      return true;
    } catch (err) {
      console.error('Error marking sample as returned:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update product status',
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
