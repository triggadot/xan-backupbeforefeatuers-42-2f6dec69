
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrderLineItem } from '@/types/purchaseOrder';
import { useToast } from '@/hooks/utils/use-toast';

export function useProductOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const addProduct = {
    mutateAsync: async ({ purchaseOrderGlideId, data }: { purchaseOrderGlideId: string, data: Partial<PurchaseOrderLineItem> }): Promise<PurchaseOrderLineItem | null> => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create a unique glide_row_id for the product
        const productGlideId = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Prepare data for database insert
        const productData = {
          glide_row_id: productGlideId,
          rowid_purchase_orders: purchaseOrderGlideId,
          vendor_product_name: data.description,
          new_product_name: data.product_name || data.description,
          cost: data.unitPrice || data.unit_price,
          total_qty_purchased: data.quantity,
          purchase_notes: data.notes
        };
        
        const { data: newProduct, error: createError } = await supabase
          .from('gl_products')
          .insert([productData])
          .select()
          .single();
          
        if (createError) throw createError;
        
        toast({
          title: 'Success',
          description: 'Product added successfully.',
        });
        
        // Map the database response to our frontend model
        return {
          id: newProduct.id,
          quantity: Number(newProduct.total_qty_purchased || 0),
          unitPrice: Number(newProduct.cost || 0),
          total: Number(newProduct.total_qty_purchased || 0) * Number(newProduct.cost || 0),
          description: newProduct.new_product_name || newProduct.vendor_product_name || 'Unnamed Product',
          productId: newProduct.glide_row_id,
          product_name: newProduct.new_product_name || newProduct.vendor_product_name || 'Unnamed Product',
          unit_price: Number(newProduct.cost || 0),
          notes: newProduct.purchase_notes || ''
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error adding product';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updateProduct = {
    mutateAsync: async ({ id, data }: { id: string, data: Partial<PurchaseOrderLineItem> }): Promise<PurchaseOrderLineItem | null> => {
      setIsLoading(true);
      setError(null);
      
      try {
        const productData: any = {};
        
        if (data.description !== undefined) {
          productData.vendor_product_name = data.description;
          productData.new_product_name = data.product_name || data.description;
        }
        if (data.unitPrice !== undefined || data.unit_price !== undefined) {
          productData.cost = data.unitPrice || data.unit_price;
        }
        if (data.quantity !== undefined) productData.total_qty_purchased = data.quantity;
        if (data.notes !== undefined) productData.purchase_notes = data.notes;
        
        const { data: updatedProduct, error: updateError } = await supabase
          .from('gl_products')
          .update(productData)
          .eq('id', id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        
        toast({
          title: 'Success',
          description: 'Product updated successfully.',
        });
        
        return {
          id: updatedProduct.id,
          quantity: Number(updatedProduct.total_qty_purchased || 0),
          unitPrice: Number(updatedProduct.cost || 0),
          total: Number(updatedProduct.total_qty_purchased || 0) * Number(updatedProduct.cost || 0),
          description: updatedProduct.new_product_name || updatedProduct.vendor_product_name || 'Unnamed Product',
          productId: updatedProduct.glide_row_id,
          product_name: updatedProduct.new_product_name || updatedProduct.vendor_product_name || 'Unnamed Product',
          unit_price: Number(updatedProduct.cost || 0),
          notes: updatedProduct.purchase_notes || ''
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error updating product';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deleteProduct = {
    mutateAsync: async ({ id }: { id: string }): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { error: deleteError } = await supabase
          .from('gl_products')
          .delete()
          .eq('id', id);
          
        if (deleteError) throw deleteError;
        
        toast({
          title: 'Success',
          description: 'Product deleted successfully.',
        });
        
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error deleting product';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    }
  };

  return {
    addProduct,
    updateProduct,
    deleteProduct,
    isLoading,
    error
  };
}
