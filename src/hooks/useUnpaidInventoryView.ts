
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UnpaidProduct } from '@/types/product';
import { useToast } from '@/hooks/use-toast';

export function useUnpaidInventoryView() {
  const [samples, setSamples] = useState<UnpaidProduct[]>([]);
  const [fronted, setFronted] = useState<UnpaidProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUnpaidInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch from the gl_unpaid_inventory view directly
      const { data: unpaidInventory, error: fetchError } = await supabase
        .from('gl_unpaid_inventory')
        .select('*');

      if (fetchError) throw new Error(fetchError.message);

      if (!unpaidInventory) {
        throw new Error('No data returned from unpaid inventory query');
      }

      // Filter and map the data for samples
      const mappedSamples: UnpaidProduct[] = unpaidInventory
        .filter(item => item.unpaid_type === 'Sample')
        .map(item => ({
          id: item.id || '',
          product_id: item.id || '',
          product_name: item.display_name || item.new_product_name || item.vendor_product_name || '',
          name: item.display_name || item.new_product_name || item.vendor_product_name || '',
          quantity: Number(item.total_qty_purchased) || 0,
          unpaid_value: Number(item.unpaid_value) || 0,
          unpaid_type: 'Sample',
          date_created: item.created_at || '',
          customer_name: item.vendor_name || '',
          customer_id: item.rowid_accounts || '',
          vendor_name: item.vendor_name || '',
          cost: Number(item.cost) || 0,
          terms_for_fronted_product: '',
          glide_row_id: item.glide_row_id || '',
          inventory_value: (Number(item.total_qty_purchased) || 0) * (Number(item.cost) || 0),
          payment_status: 'unpaid'
        }));

      // Filter and map the data for fronted products
      const mappedFronted: UnpaidProduct[] = unpaidInventory
        .filter(item => item.unpaid_type === 'Fronted')
        .map(item => ({
          id: item.id || '',
          product_id: item.id || '',
          product_name: item.display_name || item.new_product_name || item.vendor_product_name || '',
          name: item.display_name || item.new_product_name || item.vendor_product_name || '',
          quantity: Number(item.total_qty_purchased) || 0,
          unpaid_value: Number(item.unpaid_value) || 0,
          unpaid_type: 'Fronted',
          date_created: item.created_at || '',
          customer_name: item.vendor_name || '',
          customer_id: item.rowid_accounts || '',
          vendor_name: item.vendor_name || '',
          cost: Number(item.cost) || 0,
          terms_for_fronted_product: item.terms_for_fronted_product || '',
          glide_row_id: item.glide_row_id || '',
          inventory_value: (Number(item.total_qty_purchased) || 0) * (Number(item.cost) || 0),
          payment_status: 'unpaid'
        }));

      setSamples(mappedSamples);
      setFronted(mappedFronted);

      return {
        samples: mappedSamples,
        fronted: mappedFronted
      };
    } catch (err) {
      console.error('Error fetching unpaid inventory:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `Failed to load unpaid inventory: ${errorMessage}`,
        variant: 'destructive'
      });
      return { samples: [], fronted: [] };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const markAsPaid = useCallback(async (id: string, type: 'Sample' | 'Fronted') => {
    try {
      // Use RPC to update product status
      const { error } = await supabase.rpc('gl_update_product_payment_status', {
        product_id: id,
        new_status: 'Paid'
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${type} marked as paid successfully.`
      });

      // Update local state
      if (type === 'Sample') {
        setSamples(prev => prev.filter(item => item.id !== id));
      } else {
        setFronted(prev => prev.filter(item => item.id !== id));
      }

      return true;
    } catch (err) {
      console.error(`Error marking ${type} as paid:`, err);
      toast({
        title: 'Error',
        description: `Failed to mark ${type} as paid.`,
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  const markAsReturned = useCallback(async (id: string, type: 'Sample' | 'Fronted') => {
    try {
      // Use RPC to update product status
      const { error } = await supabase.rpc('gl_update_product_payment_status', {
        product_id: id,
        new_status: 'Returned'
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${type} marked as returned successfully.`
      });

      // Update local state
      if (type === 'Sample') {
        setSamples(prev => prev.filter(item => item.id !== id));
      } else {
        setFronted(prev => prev.filter(item => item.id !== id));
      }

      return true;
    } catch (err) {
      console.error(`Error marking ${type} as returned:`, err);
      toast({
        title: 'Error',
        description: `Failed to mark ${type} as returned.`,
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  return {
    samples,
    fronted,
    isLoading,
    error,
    fetchUnpaidInventory,
    markAsPaid,
    markAsReturned
  };
}
