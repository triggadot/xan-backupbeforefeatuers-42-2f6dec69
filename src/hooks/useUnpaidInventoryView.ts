
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
      // Fetch from the materialized view for samples
      const { data: samplesData, error: samplesError } = await supabase
        .from('mv_unpaid_inventory')
        .select('*')
        .eq('unpaid_type', 'Sample');

      if (samplesError) throw new Error(samplesError.message);

      // Fetch from the materialized view for fronted products
      const { data: frontedData, error: frontedError } = await supabase
        .from('mv_unpaid_inventory')
        .select('*')
        .eq('unpaid_type', 'Fronted');

      if (frontedError) throw new Error(frontedError.message);

      // Map the data to our frontend format
      const mappedSamples: UnpaidProduct[] = samplesData.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        name: item.product_name, // for component compatibility
        quantity: item.quantity || 0,
        unpaid_value: item.unpaid_value || 0,
        unpaid_type: 'Sample',
        date_created: item.created_at,
        customer_name: item.customer_name || 'Unknown',
        customer_id: item.customer_id || '',
        vendor_name: item.vendor_name || 'Unknown',
        cost: item.cost || 0,
        terms_for_fronted_product: '',
        glide_row_id: item.glide_row_id,
        inventory_value: item.inventory_value || 0,
        payment_status: 'unpaid'
      }));

      const mappedFronted: UnpaidProduct[] = frontedData.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        name: item.product_name, // for component compatibility
        quantity: item.quantity || 0,
        unpaid_value: item.unpaid_value || 0,
        unpaid_type: 'Fronted',
        date_created: item.created_at,
        customer_name: item.customer_name || 'Unknown',
        customer_id: item.customer_id || '',
        vendor_name: item.vendor_name || 'Unknown',
        cost: item.cost || 0,
        terms_for_fronted_product: item.terms_for_fronted_product || '',
        glide_row_id: item.glide_row_id,
        inventory_value: item.inventory_value || 0,
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
      const { error } = await supabase
        .from(type === 'Sample' ? 'gl_samples' : 'gl_fronted_products')
        .update({ paid: true })
        .eq('id', id);

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
      const { error } = await supabase
        .from(type === 'Sample' ? 'gl_samples' : 'gl_fronted_products')
        .update({ returned: true })
        .eq('id', id);

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
