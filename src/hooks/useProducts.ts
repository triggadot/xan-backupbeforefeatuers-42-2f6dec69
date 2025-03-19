
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('gl_products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mappedProducts = (data || []).map((product): Product => ({
        id: product.id,
        name: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
        sku: product.glide_row_id,
        description: product.purchase_notes || '',
        price: 0, // Would need to be calculated from invoice lines
        cost: product.cost || 0,
        quantity: product.total_qty_purchased || 0,
        category: product.category || '',
        status: 'active',
        imageUrl: product.product_image1 || '',
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at)
      }));
      
      setProducts(mappedProducts);
      setIsLoading(false);
      return mappedProducts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
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

  const getProduct = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('gl_products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (!data) throw new Error('Product not found');
      
      return {
        id: data.id,
        name: data.display_name || data.new_product_name || data.vendor_product_name || 'Unnamed Product',
        sku: data.glide_row_id,
        description: data.purchase_notes || '',
        price: 0, // Would need to be calculated from invoice lines
        cost: data.cost || 0,
        quantity: data.total_qty_purchased || 0,
        category: data.category || '',
        status: 'active',
        imageUrl: data.product_image1 || '',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      } as Product;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const createProduct = useCallback(async (product: Partial<Product>) => {
    try {
      // Generate a glide_row_id for new products
      const tempGlideRowId = `temp_${uuidv4()}`;
      
      const { data, error } = await supabase
        .from('gl_products')
        .insert({
          display_name: product.name,
          new_product_name: product.name,
          cost: product.cost || 0,
          total_qty_purchased: product.quantity || 0,
          category: product.category,
          product_image1: product.imageUrl,
          purchase_notes: product.description,
          glide_row_id: tempGlideRowId
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
      
      fetchProducts();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast, fetchProducts]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('gl_products')
        .update({
          display_name: updates.name,
          new_product_name: updates.name,
          cost: updates.cost,
          total_qty_purchased: updates.quantity,
          category: updates.category,
          product_image1: updates.imageUrl,
          purchase_notes: updates.description
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      
      fetchProducts();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast, fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('gl_products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      
      setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    fetchProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
  };
}
