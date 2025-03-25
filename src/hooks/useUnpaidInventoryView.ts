
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UnpaidProduct } from '@/types/product';

export const useUnpaidInventoryView = () => {
  const [samples, setSamples] = useState<UnpaidProduct[]>([]);
  const [fronted, setFronted] = useState<UnpaidProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('gl_unpaid_inventory')
          .select('*');

        if (error) throw error;

        // Process samples
        const samplesData = data
          .filter(item => item.samples === true)
          .map(item => ({
            id: item.id,
            product_id: item.glide_row_id || '',
            product_name: item.display_name || item.vendor_product_name || item.new_product_name || 'Unnamed Product',
            name: item.display_name || item.vendor_product_name || item.new_product_name || 'Unnamed Product',
            quantity: Number(item.total_qty_purchased || 0),
            unpaid_value: Number(item.unpaid_value || 0),
            unpaid_type: 'Sample',
            date_created: item.created_at || '',
            created_at: item.created_at || '', // Add the created_at field
            customer_name: item.vendor_name || 'Unknown',
            customer_id: item.rowid_accounts || '',
            product_image: item.product_image1 || '',
            notes: item.purchase_notes || '',
            status: 'active',
            is_sample: true,
            is_fronted: false,
            payment_status: 'unpaid'
          }));
        
        // Process fronted items
        const frontedData = data
          .filter(item => item.fronted === true)
          .map(item => ({
            id: item.id,
            product_id: item.glide_row_id || '',
            product_name: item.display_name || item.vendor_product_name || item.new_product_name || 'Unnamed Product',
            name: item.display_name || item.vendor_product_name || item.new_product_name || 'Unnamed Product',
            quantity: Number(item.total_qty_purchased || 0),
            unpaid_value: Number(item.unpaid_value || 0),
            unpaid_type: 'Fronted',
            date_created: item.created_at || '',
            created_at: item.created_at || '', // Add the created_at field
            customer_name: item.vendor_name || 'Unknown',
            customer_id: item.rowid_accounts || '',
            product_image: item.product_image1 || '',
            notes: item.purchase_notes || '',
            status: 'active',
            is_sample: false,
            is_fronted: true,
            payment_status: 'unpaid'
          }));

        setSamples(samplesData);
        setFronted(frontedData);
      } catch (err) {
        console.error('Error fetching unpaid inventory data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { samples, fronted, isLoading, error };
};
