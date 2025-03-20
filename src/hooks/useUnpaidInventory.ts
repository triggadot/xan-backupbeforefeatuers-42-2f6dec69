
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UnpaidProduct as ProductUnpaidType } from '@/types/product';

// Define types for unpaid product data to match the expected structure
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
  vendor_name: string;
  inventory_value: number;
  payment_status: 'Sample' | 'Fronted' | 'Paid';
  glide_row_id: string;
  terms_for_fronted_product?: string;
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
      // First get unpaid samples - using `rpc` for views and procedures
      const { data: samples, error: samplesError } = await supabase
        .rpc('get_unpaid_samples')
        .select('*');
        
      if (samplesError) throw samplesError;
      
      // Then get fronted products
      const { data: fronted, error: frontedError } = await supabase
        .rpc('get_unpaid_fronted')
        .select('*');
        
      if (frontedError) throw frontedError;
      
      // Map and combine the results
      const mappedProducts: UnpaidProduct[] = [
        ...(samples || []).map((sample: any): UnpaidProduct => ({
          id: sample.id,
          product_id: sample.product_id,
          product_name: sample.product_name || 'Unknown Product',
          quantity: Number(sample.quantity) || 0,
          unpaid_value: Number(sample.unpaid_value) || 0,
          unpaid_type: 'Sample',
          date_created: sample.date_created,
          customer_name: sample.customer_name,
          customer_id: sample.customer_id,
          vendor_name: sample.vendor_name || 'Unknown Vendor',
          inventory_value: Number(sample.inventory_value) || 0,
          payment_status: 'Sample',
          glide_row_id: sample.glide_row_id,
          terms_for_fronted_product: sample.terms_for_fronted_product,
          rawData: sample
        })),
        ...(fronted || []).map((item: any): UnpaidProduct => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name || 'Unknown Product',
          quantity: Number(item.quantity) || 0,
          unpaid_value: Number(item.unpaid_value) || 0,
          unpaid_type: 'Fronted',
          date_created: item.date_created,
          customer_name: item.customer_name,
          customer_id: item.customer_id,
          vendor_name: item.vendor_name || 'Unknown Vendor',
          inventory_value: Number(item.inventory_value) || 0,
          payment_status: 'Fronted',
          glide_row_id: item.glide_row_id,
          terms_for_fronted_product: item.terms_for_fronted_product,
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
  const markAsPaid = async (productId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const product = unpaidProducts.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      if (product.unpaid_type === 'Sample') {
        // Update the sample as paid - using direct SQL with RPC
        const { error } = await supabase
          .rpc('update_sample_paid_status', { 
            sample_id: productId,
            paid_status: true
          });
          
        if (error) throw error;
      } else {
        // Update the fronted product as paid
        const { error } = await supabase
          .rpc('update_fronted_paid_status', { 
            fronted_id: productId,
            paid_status: true
          });
          
        if (error) throw error;
      }
      
      // Refresh the list
      await fetchUnpaidInventory();
      
      toast({
        title: "Success",
        description: `${product.product_name} marked as paid.`,
      });
      
      return true;
    } catch (err) {
      console.error('Error marking product as paid:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      toast({
        title: "Error",
        description: "Failed to mark product as paid.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Mark a product as returned
  const markAsReturned = async (productId: string): Promise<boolean> => {
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
          .rpc('update_sample_returned_status', { 
            sample_id: productId,
            returned_status: true
          });
          
        if (error) throw error;
      } else {
        // Update the fronted product as returned
        const { error } = await supabase
          .rpc('update_fronted_returned_status', { 
            fronted_id: productId,
            returned_status: true
          });
          
        if (error) throw error;
      }
      
      // Refresh the list
      await fetchUnpaidInventory();
      
      toast({
        title: "Success",
        description: `${product.product_name} marked as returned.`,
      });
      
      return true;
    } catch (err) {
      console.error('Error marking product as returned:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      toast({
        title: "Error",
        description: "Failed to mark product as returned.",
        variant: "destructive",
      });
      
      return false;
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
