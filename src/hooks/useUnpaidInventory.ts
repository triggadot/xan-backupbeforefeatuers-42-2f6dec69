
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UnpaidProduct } from '@/types/product';

export const useUnpaidInventory = (includeSample = true, includeFronted = true) => {
  const [products, setProducts] = useState<UnpaidProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnpaidInventory();
  }, [includeSample, includeFronted]);

  const fetchUnpaidInventory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch from the unpaid inventory view
      const { data, error } = await supabase
        .from('gl_unpaid_inventory')
        .select('*');

      if (error) throw error;

      // Filter based on parameters
      const filteredData = data.filter(item => {
        if (includeSample && item.samples) return true;
        if (includeFronted && item.fronted) return true;
        return false;
      });

      // Transform to UnpaidProduct format
      const transformedData: UnpaidProduct[] = filteredData.map(item => ({
        id: item.id,
        product_id: item.glide_row_id || '',
        name: item.display_name || item.vendor_product_name || item.new_product_name || 'Unnamed Product',
        quantity: Number(item.total_qty_purchased || 0),
        unpaid_value: Number(item.unpaid_value || 0),
        unpaid_type: item.samples ? 'Sample' : item.fronted ? 'Fronted' : 'Unknown',
        date_created: item.created_at || '',
        created_at: item.created_at || '',
        customer_name: item.vendor_name || 'Unknown',
        customer_id: item.rowid_accounts || '',
        product_image: item.product_image1 || '',
        notes: item.purchase_notes || '',
        status: 'active',
        is_sample: !!item.samples,
        is_fronted: !!item.fronted,
        payment_status: 'unpaid',
        
        // Additional fields from the DB that components need
        vendor_product_name: item.vendor_product_name || '',
        new_product_name: item.new_product_name || '',
        display_name: item.display_name || '',
        vendor_name: item.vendor_name || '',
        total_qty_purchased: Number(item.total_qty_purchased || 0),
        cost: Number(item.cost || 0),
        terms_for_fronted_product: item.terms_for_fronted_product || '',
        glide_row_id: item.glide_row_id || ''
      }));

      setProducts(transformedData);
    } catch (err) {
      console.error('Error fetching unpaid inventory:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    products,
    isLoading,
    error
  };
};
