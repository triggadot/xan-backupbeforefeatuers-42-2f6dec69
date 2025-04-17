import { glProductsService } from "@/services/supabase/tables";
import { Product, ProductFormData } from "@/types/products";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook for creating, updating, and deleting products
 * @returns Mutation functions for product operations
 */
export const useProductMutation = () => {
  const queryClient = useQueryClient();

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: async (productData: ProductFormData): Promise<Product> => {
      const newProduct = await glProductsService.createProduct({
        ...productData,
        name: productData.name || "Unnamed Product",
      });

      return newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ProductFormData>;
    }): Promise<Product> => {
      const updatedProduct = await glProductsService.updateProduct(id, data);

      return updatedProduct;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
    },
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await glProductsService.deleteProduct(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.removeQueries({ queryKey: ["product", id] });
    },
  });

  return {
    createProduct,
    updateProduct,
    deleteProduct,
  };
};

export default useProductMutation;
