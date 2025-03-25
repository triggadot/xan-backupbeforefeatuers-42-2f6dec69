
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrderLineItem } from '@/types/purchaseOrder';

export function useProductOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Add a product to a purchase order
  const addProduct = useMutation({
    mutationFn: async ({ 
      purchaseOrderGlideId, 
      data 
    }: { 
      purchaseOrderGlideId: string, 
      data: Partial<PurchaseOrderLineItem> 
    }) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data: newProduct, error: productError } = await supabase
          .from('gl_products')
          .insert({
            rowid_purchase_orders: purchaseOrderGlideId,
            vendor_product_name: data.product_name || data.description,
            new_product_name: data.description,
            cost: data.unitPrice || data.unit_price,
            total_qty_purchased: data.quantity,
            purchase_notes: data.notes
          })
          .select()
          .single();
        
        if (productError) throw productError;
        
        // Trigger PO totals update via DB trigger
        
        return newProduct;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error adding product:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });

  // Update a product
  const updateProduct = useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string, 
      data: Partial<PurchaseOrderLineItem> 
    }) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data: updatedProduct, error: productError } = await supabase
          .from('gl_products')
          .update({
            vendor_product_name: data.product_name || data.description,
            new_product_name: data.description,
            cost: data.unitPrice || data.unit_price,
            total_qty_purchased: data.quantity,
            purchase_notes: data.notes
          })
          .eq('id', id)
          .select()
          .single();
        
        if (productError) throw productError;
        
        // Trigger PO totals update via DB trigger
        
        return updatedProduct;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error updating product:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });

  // Delete a product
  const deleteProduct = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { error: productError } = await supabase
          .from('gl_products')
          .delete()
          .eq('id', id);
        
        if (productError) throw productError;
        
        // Trigger PO totals update via DB trigger
        
        return id;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error deleting product:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });

  return {
    addProduct,
    updateProduct,
    deleteProduct,
    isLoading,
    error
  };
}
