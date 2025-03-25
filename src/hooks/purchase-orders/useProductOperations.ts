
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrderLineItem } from '@/types/purchaseOrder';
import { useToast } from '@/hooks/use-toast';

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
        const productGlideId = `PRODUCT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Prepare data for database insert
        const productData = {
          glide_row_id: productGlideId,
          rowid_purchase_orders: purchaseOrderGlideId,
          vendor_product_name: data.description,
          new_product_name: data.product_name || data.description,
          cost: data.unitPrice,
          total_qty_purchased: data.quantity,
          purchase_notes: data.notes
        };
        
        const { data: newProduct, error: createError } = await supabase
          .from('gl_products')
          .insert([productData])
          .select()
          .single();
          
        if (createError) throw createError;
        
        // Update the purchase order total
        await updatePurchaseOrderTotal(purchaseOrderGlideId);
        
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
          description: newProduct.vendor_product_name || newProduct.new_product_name || '',
          productId: newProduct.glide_row_id,
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
        // Get the current product to access the purchase order ID
        const { data: currentProduct, error: fetchError } = await supabase
          .from('gl_products')
          .select('*')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Prepare data for database update
        const productData: any = {};
        
        if (data.description !== undefined) productData.vendor_product_name = data.description;
        if (data.product_name !== undefined) productData.new_product_name = data.product_name;
        if (data.quantity !== undefined) productData.total_qty_purchased = data.quantity;
        if (data.unitPrice !== undefined) productData.cost = data.unitPrice;
        if (data.notes !== undefined) productData.purchase_notes = data.notes;
        
        // Update the product
        const { data: updatedProduct, error: updateError } = await supabase
          .from('gl_products')
          .update(productData)
          .eq('id', id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        
        // Update the purchase order total
        await updatePurchaseOrderTotal(currentProduct.rowid_purchase_orders);
        
        toast({
          title: 'Success',
          description: 'Product updated successfully.',
        });
        
        // Map the database response to our frontend model
        return {
          id: updatedProduct.id,
          quantity: Number(updatedProduct.total_qty_purchased || 0),
          unitPrice: Number(updatedProduct.cost || 0),
          total: Number(updatedProduct.total_qty_purchased || 0) * Number(updatedProduct.cost || 0),
          description: updatedProduct.vendor_product_name || updatedProduct.new_product_name || '',
          productId: updatedProduct.glide_row_id,
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
        // Get the current product to access the purchase order ID
        const { data: product, error: fetchError } = await supabase
          .from('gl_products')
          .select('rowid_purchase_orders')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Delete the product
        const { error: deleteError } = await supabase
          .from('gl_products')
          .delete()
          .eq('id', id);
          
        if (deleteError) throw deleteError;
        
        // Update the purchase order total
        await updatePurchaseOrderTotal(product.rowid_purchase_orders);
        
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

  // Helper function to update purchase order totals
  const updatePurchaseOrderTotal = async (purchaseOrderGlideId: string) => {
    try {
      // Calculate total from products
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select('cost, total_qty_purchased')
        .eq('rowid_purchase_orders', purchaseOrderGlideId);
        
      if (productsError) throw productsError;
      
      const total = products.reduce((sum, item) => {
        const cost = Number(item.cost || 0);
        const quantity = Number(item.total_qty_purchased || 0);
        return sum + (cost * quantity);
      }, 0);
      
      // Get total payments
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('payment_amount')
        .eq('rowid_purchase_orders', purchaseOrderGlideId);
        
      if (paymentsError) throw paymentsError;
      
      const totalPaid = payments.reduce((sum, payment) => sum + (Number(payment.payment_amount) || 0), 0);
      
      // Update purchase order with new totals
      const { error: updateError } = await supabase
        .from('gl_purchase_orders')
        .update({
          total_amount: total,
          total_paid: totalPaid,
          balance: total - totalPaid,
          product_count: products.length
        })
        .eq('glide_row_id', purchaseOrderGlideId);
        
      if (updateError) throw updateError;
      
    } catch (err) {
      console.error('Error updating purchase order total:', err);
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
