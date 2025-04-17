import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductFormData } from '@/types/products';

/**
 * Hook for creating, updating, and deleting products
 * @returns Mutation functions for product operations
 */
export const useProductMutation = () => {
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const { data, error } = await supabase
        .from('gl_products')
        .insert([{
          ...productData,
          glide_row_id: `gl_products_${Date.now()}`, // Generate a unique glide_row_id
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating product: ${error.message}`);
      }

      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const { data: updatedProduct, error } = await supabase
        .from('gl_products')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('glide_row_id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating product: ${error.message}`);
      }

      return updatedProduct as Product;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gl_products')
        .delete()
        .eq('glide_row_id', id);

      if (error) {
        throw new Error(`Error deleting product: ${error.message}`);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    createProduct,
    updateProduct,
    deleteProduct,
  };
};

export default useProductMutation;
