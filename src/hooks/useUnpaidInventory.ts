
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
      // Use the view we created for unpaid inventory
      const { data, error } = await supabase
        .from('gl_unpaid_inventory')
        .select('*, vendor_name')
        .order('unpaid_value', { ascending: false });
      
      if (error) throw error;
      
      const mappedProducts = (data || []).map((product): UnpaidProduct => {
        return {
          id: product.id,
          name: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
          sku: product.glide_row_id,
          description: product.purchase_notes || '',
          price: 0, // Not applicable for unpaid inventory
          cost: product.cost || 0,
          quantity: product.total_qty_purchased || 0,
          category: product.category || '',
          status: 'active',
          imageUrl: product.product_image1 || '',
          vendorName: product.vendor_name || '',
          vendorId: product.rowid_accounts || '',
          createdAt: new Date(product.created_at),
          updatedAt: new Date(product.updated_at),
          // Unpaid product specific fields
          unpaid_type: product.unpaid_type,
          unpaid_value: product.unpaid_value || 0,
          vendor_name: product.vendor_name || '',
          inventory_value: (product.cost || 0) * (product.total_qty_purchased || 0),
          sample_value: product.samples ? (product.cost || 0) * (product.total_units_behind_sample || product.total_qty_purchased || 0) : 0,
          fronted_value: product.fronted ? (product.cost || 0) * (product.total_qty_purchased || 0) : 0,
          payment_status: product.samples ? 'Sample' : (product.fronted ? 'Fronted' : 'Paid'),
          terms_for_fronted_product: product.terms_for_fronted_product,
          // Additional fields from the database
          isSample: product.samples || false,
          isFronted: product.fronted || false,
          isMiscellaneous: product.miscellaneous_items || false,
          purchaseDate: product.product_purchase_date ? new Date(product.product_purchase_date) : null,
          frontedTerms: product.terms_for_fronted_product || '',
          totalUnitsBehindSample: product.total_units_behind_sample || 0,
          rawData: product
        };
      });
      
      setUnpaidProducts(mappedProducts);
      setIsLoading(false);
      return mappedProducts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch unpaid inventory';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return [];
    }
  }, [toast]);

  const markAsPaid = useCallback(async (productId: string) => {
    setIsLoading(true);
    try {
      // Call our function to update the product payment status
      const { data, error } = await supabase
        .rpc('gl_update_product_payment_status', { 
          product_id: productId,
          new_status: 'Paid'
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Product marked as paid',
      });
      
      // Refresh the unpaid inventory list
      await fetchUnpaidInventory();
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark product as paid';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
  }, [fetchUnpaidInventory, toast]);

  const markAsReturned = useCallback(async (productId: string) => {
    setIsLoading(true);
    try {
      // Call our function to update the product payment status
      const { data, error } = await supabase
        .rpc('gl_update_product_payment_status', { 
          product_id: productId,
          new_status: 'Returned'
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Product marked as returned to vendor',
      });
      
      // Refresh the unpaid inventory list
      await fetchUnpaidInventory();
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark product as returned';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
  }, [fetchUnpaidInventory, toast]);

  // Fetch unpaid inventory on component mount
  useEffect(() => {
    fetchUnpaidInventory();
  }, [fetchUnpaidInventory]);

  return {
    unpaidProducts,
    isLoading,
    error,
    fetchUnpaidInventory,
    markAsPaid,
    markAsReturned
  };
}
