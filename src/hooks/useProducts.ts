
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
      // Use the new materialized view for better performance
      const { data, error } = await supabase
        .from('mv_product_vendor_details')
        .select('*')
        .order('product_purchase_date', { ascending: false });
      
      if (error) throw error;
      
      const mappedProducts = (data || []).map((product): Product => {
        return {
          id: product.product_id,
          name: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
          sku: product.product_glide_id,
          description: '', // Will need to fetch from gl_products if needed
          price: 0, // Would need to be calculated from invoice lines
          cost: product.cost || 0,
          quantity: product.total_qty_purchased || 0,
          category: product.category || '',
          status: 'active',
          imageUrl: product.product_image1 || '',
          vendorName: product.vendor_name || '',
          vendorId: product.vendor_glide_id || '',
          createdAt: new Date(), // We'd need to add created_at to the view
          updatedAt: new Date(), // We'd need to add updated_at to the view
          // Additional fields from the database
          isSample: product.samples || false,
          isFronted: product.fronted || false,
          isMiscellaneous: product.miscellaneous_items || false,
          purchaseDate: product.product_purchase_date ? new Date(product.product_purchase_date) : null,
          frontedTerms: '', // Will need to fetch from gl_products if needed
          totalUnitsBehindSample: 0, // Will need to fetch from gl_products if needed
          rawData: product
        };
      });
      
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
      // First try to get from the materialized view
      const { data: mvData, error: mvError } = await supabase
        .from('mv_product_vendor_details')
        .select('*')
        .eq('product_id', id)
        .single();
      
      if (mvError || !mvData) {
        // Fallback to the original table for complete data
        const { data, error } = await supabase
          .from('gl_products')
          .select(`
            *,
            gl_accounts!inner(account_name, accounts_uid)
          `)
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (!data) throw new Error('Product not found');
        
        // Extract vendorData safely
        const vendorData = data.gl_accounts || {};
        const vendorName = (vendorData as any).account_name || '';
        const vendorUid = (vendorData as any).accounts_uid || '';
        
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
          vendorName: vendorName,
          vendorId: data.rowid_accounts || '',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          // Add additional fields
          isSample: data.samples || false,
          isFronted: data.fronted || false,
          isMiscellaneous: data.miscellaneous_items || false,
          purchaseDate: data.product_purchase_date ? new Date(data.product_purchase_date) : null,
          frontedTerms: data.terms_for_fronted_product || '',
          totalUnitsBehindSample: data.total_units_behind_sample || 0,
          rawData: data
        } as Product;
      }
      
      // Get additional details not in materialized view
      const { data: detailsData, error: detailsError } = await supabase
        .from('gl_products')
        .select('purchase_notes, terms_for_fronted_product, total_units_behind_sample, created_at, updated_at')
        .eq('id', id)
        .single();
        
      if (detailsError) throw detailsError;
      
      // Map from materialized view data
      return {
        id: mvData.product_id,
        name: mvData.display_name || mvData.new_product_name || mvData.vendor_product_name || 'Unnamed Product',
        sku: mvData.product_glide_id,
        description: detailsData?.purchase_notes || '',
        price: 0, // Would need to be calculated from invoice lines
        cost: mvData.cost || 0,
        quantity: mvData.total_qty_purchased || 0,
        category: mvData.category || '',
        status: 'active',
        imageUrl: mvData.product_image1 || '',
        vendorName: mvData.vendor_name || '',
        vendorId: mvData.vendor_glide_id || '',
        createdAt: detailsData?.created_at ? new Date(detailsData.created_at) : new Date(),
        updatedAt: detailsData?.updated_at ? new Date(detailsData.updated_at) : new Date(),
        // Add additional fields
        isSample: mvData.samples || false,
        isFronted: mvData.fronted || false,
        isMiscellaneous: mvData.miscellaneous_items || false,
        purchaseDate: mvData.product_purchase_date ? new Date(mvData.product_purchase_date) : null,
        frontedTerms: detailsData?.terms_for_fronted_product || '',
        totalUnitsBehindSample: detailsData?.total_units_behind_sample || 0,
        rawData: { ...mvData, ...detailsData }
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
    setIsLoading(true);
    try {
      // Generate a glide_row_id for new products
      const tempGlideRowId = `temp_${uuidv4()}`;
      
      // Set default category if miscellaneous but no category provided
      let category = product.category;
      if (product.isMiscellaneous && !category) {
        category = 'Flower'; // Default category
      }
      
      const { data, error } = await supabase
        .from('gl_products')
        .insert({
          glide_row_id: tempGlideRowId,
          display_name: product.name, // Will be auto-calculated by trigger
          new_product_name: product.name,
          vendor_product_name: product.name, // Use the same name for both fields
          cost: product.cost || 0,
          total_qty_purchased: product.quantity || 0,
          category: category,
          product_image1: product.imageUrl || null,
          purchase_notes: product.description || null,
          rowid_accounts: product.vendorId || null,
          product_purchase_date: product.purchaseDate instanceof Date ? product.purchaseDate.toISOString() : null,
          po_po_date: product.purchaseDate instanceof Date ? product.purchaseDate.toISOString() : null, // Same as purchase date
          
          // Special product flags
          samples: product.isSample || false,
          fronted: product.isFronted || false,
          samples_or_fronted: product.isSample || product.isFronted || false,
          miscellaneous_items: product.isMiscellaneous || false,
          
          // Conditional fields based on product type
          terms_for_fronted_product: product.isFronted ? (product.frontedTerms || null) : null,
          total_units_behind_sample: product.isSample ? (product.totalUnitsBehindSample || 0) : null
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
      
      await fetchProducts();
      setIsLoading(false);
      
      return data ? data[0] : null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return null;
    }
  }, [toast, fetchProducts]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    setIsLoading(true);
    try {
      // Set default category if miscellaneous but no category provided
      let category = updates.category;
      if (updates.isMiscellaneous && !category) {
        category = 'Flower'; // Default category
      }
      
      const { data, error } = await supabase
        .from('gl_products')
        .update({
          display_name: updates.name, // Will be auto-calculated by trigger
          new_product_name: updates.name,
          vendor_product_name: updates.name, // Update both name fields for consistency
          cost: updates.cost,
          total_qty_purchased: updates.quantity,
          category: category,
          product_image1: updates.imageUrl,
          purchase_notes: updates.description,
          rowid_accounts: updates.vendorId,
          product_purchase_date: updates.purchaseDate instanceof Date ? updates.purchaseDate.toISOString() : null,
          po_po_date: updates.purchaseDate instanceof Date ? updates.purchaseDate.toISOString() : null,
          
          // Special product flags
          samples: updates.isSample,
          fronted: updates.isFronted,
          samples_or_fronted: updates.isSample || updates.isFronted,
          miscellaneous_items: updates.isMiscellaneous,
          
          // Conditional fields based on product type
          terms_for_fronted_product: updates.isFronted ? (updates.frontedTerms || null) : null,
          total_units_behind_sample: updates.isSample ? (updates.totalUnitsBehindSample || 0) : null
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      
      await fetchProducts();
      setIsLoading(false);
      
      return data ? data[0] : null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return null;
    }
  }, [toast, fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    setIsLoading(true);
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
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
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
