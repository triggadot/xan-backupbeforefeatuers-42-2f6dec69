
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
  ProductRow,
  asNumber,
  asBoolean,
  asDate
} from '@/types/supabase';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Refresh the materialized view
      await supabase.rpc('refresh_materialized_view_secure', {
        view_name: 'mv_product_vendor_details'
      });
      
      // Use the materialized view for improved performance
      const { data, error } = await supabase
        .from('mv_product_vendor_details')
        .select('*')
        .order('product_purchase_date', { ascending: false });
      
      if (error) throw error;
      
      const mappedProducts = (data || []).map((product: ProductRow): Product => {
        return {
          id: String(product.id || product.glide_row_id || ''),
          name: String(product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product'),
          sku: String(product.glide_row_id || ''),
          description: String(product.purchase_notes || ''), 
          price: 0, // Would need to be calculated from invoice lines
          cost: asNumber(product.cost || 0),
          quantity: asNumber(product.total_qty_purchased || 0),
          category: String(product.category || ''),
          status: 'active',
          imageUrl: String(product.product_image1 || ''),
          vendorName: String(product.vendor_name || ''),
          vendorId: String(product.vendor_glide_id || product.rowid_accounts || ''),
          createdAt: asDate(product.created_at) || new Date(),
          updatedAt: asDate(product.updated_at) || new Date(),
          // Additional fields from the database
          isSample: asBoolean(product.samples || false),
          isFronted: asBoolean(product.fronted || false),
          isMiscellaneous: asBoolean(product.miscellaneous_items || false),
          purchaseDate: asDate(product.product_purchase_date),
          frontedTerms: String(product.terms_for_fronted_product || ''),
          totalUnitsBehindSample: asNumber(product.total_units_behind_sample || 0),
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
        const product = data as ProductRow;
        const vendorData = product.gl_accounts || {};
        const vendorName = vendorData && typeof vendorData === 'object' && 'account_name' in vendorData
          ? String(vendorData.account_name || '')
          : '';
        const vendorUid = vendorData && typeof vendorData === 'object' && 'accounts_uid' in vendorData
          ? String(vendorData.accounts_uid || '')
          : '';
        
        return {
          id: String(product.id || ''),
          name: String(product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product'),
          sku: String(product.glide_row_id || ''),
          description: String(product.purchase_notes || ''),
          price: 0, // Would need to be calculated from invoice lines
          cost: asNumber(product.cost || 0),
          quantity: asNumber(product.total_qty_purchased || 0),
          category: String(product.category || ''),
          status: 'active',
          imageUrl: String(product.product_image1 || ''),
          vendorName: vendorName,
          vendorId: String(product.rowid_accounts || ''),
          createdAt: asDate(product.created_at) || new Date(),
          updatedAt: asDate(product.updated_at) || new Date(),
          // Add additional fields
          isSample: asBoolean(product.samples || false),
          isFronted: asBoolean(product.fronted || false),
          isMiscellaneous: asBoolean(product.miscellaneous_items || false),
          purchaseDate: asDate(product.product_purchase_date),
          frontedTerms: String(product.terms_for_fronted_product || ''),
          totalUnitsBehindSample: asNumber(product.total_units_behind_sample || 0),
          rawData: product
        } as Product;
      }
      
      // Get additional details not in materialized view
      const { data: detailsData, error: detailsError } = await supabase
        .from('gl_products')
        .select('purchase_notes, terms_for_fronted_product, total_units_behind_sample, created_at, updated_at')
        .eq('id', id)
        .single();
        
      if (detailsError) throw detailsError;
      
      const product = mvData as ProductRow;
      
      // Map from materialized view data
      return {
        id: String(product.product_id || product.id || ''),
        name: String(product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product'),
        sku: String(product.product_glide_id || product.glide_row_id || ''),
        description: String(detailsData?.purchase_notes || ''),
        price: 0, // Would need to be calculated from invoice lines
        cost: asNumber(product.cost || 0),
        quantity: asNumber(product.total_qty_purchased || 0),
        category: String(product.category || ''),
        status: 'active',
        imageUrl: String(product.product_image1 || ''),
        vendorName: String(product.vendor_name || ''),
        vendorId: String(product.vendor_glide_id || product.rowid_accounts || ''),
        createdAt: asDate(detailsData?.created_at) || new Date(),
        updatedAt: asDate(detailsData?.updated_at) || new Date(),
        // Add additional fields
        isSample: asBoolean(product.samples || false),
        isFronted: asBoolean(product.fronted || false),
        isMiscellaneous: asBoolean(product.miscellaneous_items || false),
        purchaseDate: asDate(product.product_purchase_date),
        frontedTerms: String(detailsData?.terms_for_fronted_product || ''),
        totalUnitsBehindSample: asNumber(detailsData?.total_units_behind_sample || 0),
        rawData: { ...product, ...detailsData }
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
