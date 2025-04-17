import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_products table
 */

// Database schema type matching Supabase gl_products table
export interface GlProductRecord {
  id: string;
  glide_row_id: string;
  rowid_accounts?: string;
  rowid_vendor_payments?: string;
  rowid_purchase_orders?: string;
  purchase_order_uid?: string;
  po_date?: string;
  vendor_product_name?: string;
  new_product_name?: string;
  date_of_purchase?: string;
  total_qty_purchased?: number;
  cost?: number;
  is_sample_or_fronted?: boolean;
  is_fronted?: boolean;
  terms_for_fronted_product?: string;
  is_sample?: boolean;
  total_units_behind_sample?: number;
  purchase_note?: string;
  is_miscellaneous?: boolean;
  category?: string;
  product_image1?: string;
  date_timestamp_subm?: string;
  email_email_of_user_who_added_product?: string;
  created_at: string;
  updated_at: string;
  display_name?: string;
  total_cost?: number;
  public_url_image?: string;
  public_url_video?: string;
  new_product_sku?: string;
  product_sku?: string;
  vendor_uid?: string;
  // Include related data
  account?: {
    id: string;
    account_name: string;
    account_type: string;
  } | null;
}

// Type for database insert/update operations
export interface GlProductInsert {
  glide_row_id: string;
  rowid_accounts?: string;
  rowid_vendor_payments?: string;
  rowid_purchase_orders?: string;
  purchase_order_uid?: string;
  po_date?: string;
  vendor_product_name?: string;
  new_product_name?: string;
  date_of_purchase?: string;
  total_qty_purchased?: number;
  cost?: number;
  is_sample_or_fronted?: boolean;
  is_fronted?: boolean;
  terms_for_fronted_product?: string;
  is_sample?: boolean;
  total_units_behind_sample?: number;
  purchase_note?: string;
  is_miscellaneous?: boolean;
  category?: string;
  product_image1?: string;
  date_timestamp_subm?: string;
  email_email_of_user_who_added_product?: string;
  display_name?: string;
  new_product_sku?: string;
  product_sku?: string;
  vendor_uid?: string;
}

// Frontend filter interface
export interface ProductFilters {
  category?: string;
  vendorId?: string;
  purchaseOrderId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  onlySamples?: boolean;
  onlyFronted?: boolean;
  onlyMiscellaneous?: boolean;
}

// Form data for creating/updating products
export interface ProductForm {
  name?: string;
  vendorId?: string;
  category?: string;
  cost?: number;
  quantity?: number;
  purchaseDate?: Date;
  notes?: string;
  isSample?: boolean;
  isFronted?: boolean;
  isMiscellaneous?: boolean;
  frontedTerms?: string;
  product_image1?: string;
}

// Product model for frontend use
export interface Product {
  id: string;
  glide_row_id: string;
  display_name: string;
  new_product_name?: string;
  vendor_product_name?: string;
  rowid_accounts?: string;
  vendorName?: string;
  vendorId?: string;
  rowid_vendor_payments?: string;
  rowid_purchase_orders?: string;
  purchaseOrderId?: string;
  category?: string;
  cost: number; // Required field
  total_qty_purchased: number; // Required field
  samples?: boolean;
  fronted?: boolean;
  miscellaneous_items?: boolean;
  terms_for_fronted_product?: string;
  total_units_behind_sample?: number;
  product_purchase_date?: Date | null;
  purchaseDate?: Date | null;
  purchase_notes?: string;
  product_image1?: string;
  created_at: string;
  updated_at: string;
  // Derived flags
  isSample?: boolean;
  isFronted?: boolean;
  isMiscellaneous?: boolean;
  // Adding missing fields
  name?: string; // Alias for display_name
  quantity?: number; // Alias for total_qty_purchased
}

/**
 * Products service for Supabase operations
 * Handles CRUD operations for gl_products table
 */
export const glProductsService = {
  /**
   * Get all products with optional filtering
   */
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    let query = supabase
      .from('gl_products')
      .select(`
        *,
        account:rowid_accounts(id, account_name, account_type)
      `);

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.vendorId) {
      query = query.eq('rowid_accounts', filters.vendorId);
    }

    if (filters.purchaseOrderId) {
      query = query.eq('rowid_purchase_orders', filters.purchaseOrderId);
    }

    if (filters.onlySamples) {
      query = query.eq('is_sample', true);
    }

    if (filters.onlyFronted) {
      query = query.eq('is_fronted', true);
    }

    if (filters.onlyMiscellaneous) {
      query = query.eq('is_miscellaneous', true);
    }

    if (filters.search) {
      query = query.or(
        `vendor_product_name.ilike.%${filters.search}%,new_product_name.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
      );
    }

    if (filters.dateFrom) {
      query = query.gte('date_of_purchase', filters.dateFrom.toISOString());
    }

    if (filters.dateTo) {
      query = query.lte('date_of_purchase', filters.dateTo.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    // Transform the data to match our Product interface
    return (data as unknown as GlProductRecord[]).map(item => {
      const product: Product = {
        id: item.id,
        glide_row_id: item.glide_row_id,
        display_name: item.display_name || item.new_product_name || item.vendor_product_name || 'Unnamed Product',
        new_product_name: item.new_product_name,
        vendor_product_name: item.vendor_product_name,
        rowid_accounts: item.rowid_accounts,
        vendorName: item.account?.account_name,
        vendorId: item.rowid_accounts,
        rowid_vendor_payments: item.rowid_vendor_payments,
        rowid_purchase_orders: item.rowid_purchase_orders,
        purchaseOrderId: item.rowid_purchase_orders,
        category: item.category,
        cost: item.cost || 0, // Default to 0 if null (required field)
        total_qty_purchased: item.total_qty_purchased || 0, // Default to 0 if null (required field)
        samples: item.is_sample,
        fronted: item.is_fronted,
        miscellaneous_items: item.is_miscellaneous,
        terms_for_fronted_product: item.terms_for_fronted_product,
        total_units_behind_sample: item.total_units_behind_sample,
        product_purchase_date: item.date_of_purchase ? new Date(item.date_of_purchase) : null,
        purchaseDate: item.date_of_purchase ? new Date(item.date_of_purchase) : null,
        purchase_notes: item.purchase_note,
        product_image1: item.product_image1,
        created_at: item.created_at,
        updated_at: item.updated_at,
        // Derived flags
        isSample: item.is_sample,
        isFronted: item.is_fronted,
        isMiscellaneous: item.is_miscellaneous,
        // Alias fields
        name: item.display_name || item.new_product_name || item.vendor_product_name || 'Unnamed Product',
        quantity: item.total_qty_purchased || 0
      };
      return product;
    });
  },

  /**
   * Get a single product by ID
   */
  async getProductById(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('gl_products')
      .select(`
        *,
        account:rowid_accounts(id, account_name, account_type)
      `)
      .eq('glide_row_id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Product with ID ${id} not found`);
    }

    // Transform the data to match our Product interface
    const item = data as unknown as GlProductRecord;
    const product: Product = {
      id: item.id,
      glide_row_id: item.glide_row_id,
      display_name: item.display_name || item.new_product_name || item.vendor_product_name || 'Unnamed Product',
      new_product_name: item.new_product_name,
      vendor_product_name: item.vendor_product_name,
      rowid_accounts: item.rowid_accounts,
      vendorName: item.account?.account_name,
      vendorId: item.rowid_accounts,
      rowid_vendor_payments: item.rowid_vendor_payments,
      rowid_purchase_orders: item.rowid_purchase_orders,
      purchaseOrderId: item.rowid_purchase_orders,
      category: item.category,
      cost: item.cost || 0, // Default to 0 if null (required field)
      total_qty_purchased: item.total_qty_purchased || 0, // Default to 0 if null (required field)
      samples: item.is_sample,
      fronted: item.is_fronted,
      miscellaneous_items: item.is_miscellaneous,
      terms_for_fronted_product: item.terms_for_fronted_product,
      total_units_behind_sample: item.total_units_behind_sample,
      product_purchase_date: item.date_of_purchase ? new Date(item.date_of_purchase) : null,
      purchaseDate: item.date_of_purchase ? new Date(item.date_of_purchase) : null,
      purchase_notes: item.purchase_note,
      product_image1: item.product_image1,
      created_at: item.created_at,
      updated_at: item.updated_at,
      // Derived flags
      isSample: item.is_sample,
      isFronted: item.is_fronted,
      isMiscellaneous: item.is_miscellaneous,
      // Alias fields
      name: item.display_name || item.new_product_name || item.vendor_product_name || 'Unnamed Product',
      quantity: item.total_qty_purchased || 0
    };

    return product;
  },

  /**
   * Create a new product
   */
  async createProduct(productData: ProductForm): Promise<Product> {
    // Generate a UUID for the glide_row_id
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    const dbProduct: GlProductInsert = {
      glide_row_id: uuid,
      new_product_name: productData.name,
      rowid_accounts: productData.vendorId,
      category: productData.category,
      cost: productData.cost,
      total_qty_purchased: productData.quantity,
      date_of_purchase: productData.purchaseDate?.toISOString(),
      purchase_note: productData.notes,
      is_sample: productData.isSample,
      is_fronted: productData.isFronted,
      is_miscellaneous: productData.isMiscellaneous,
      terms_for_fronted_product: productData.frontedTerms,
      product_image1: productData.product_image1,
      // Compute display_name
      display_name: productData.name || 'Unnamed Product'
    };

    const { data, error } = await supabase
      .from('gl_products')
      .insert(dbProduct)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw new Error(`Failed to create product: ${error.message}`);
    }

    // Return the newly created product
    return this.getProductById(data.glide_row_id);
  },

  /**
   * Update an existing product
   */
  async updateProduct(id: string, productData: Partial<ProductForm>): Promise<Product> {
    // Transform the form data to match the database schema
    const dbProduct = { glide_row_id: id } as GlProductInsert;
    
    if (productData.name !== undefined) {
      dbProduct.new_product_name = productData.name;
      dbProduct.display_name = productData.name;
    }
    if (productData.vendorId !== undefined) dbProduct.rowid_accounts = productData.vendorId;
    if (productData.category !== undefined) dbProduct.category = productData.category;
    if (productData.cost !== undefined) dbProduct.cost = productData.cost;
    if (productData.quantity !== undefined) dbProduct.total_qty_purchased = productData.quantity;
    if (productData.purchaseDate !== undefined) {
      dbProduct.date_of_purchase = productData.purchaseDate?.toISOString();
    }
    if (productData.notes !== undefined) dbProduct.purchase_note = productData.notes;
    if (productData.isSample !== undefined) dbProduct.is_sample = productData.isSample;
    if (productData.isFronted !== undefined) dbProduct.is_fronted = productData.isFronted;
    if (productData.isMiscellaneous !== undefined) dbProduct.is_miscellaneous = productData.isMiscellaneous;
    if (productData.frontedTerms !== undefined) dbProduct.terms_for_fronted_product = productData.frontedTerms;
    if (productData.product_image1 !== undefined) dbProduct.product_image1 = productData.product_image1;

    const { error } = await supabase
      .from('gl_products')
      .update(dbProduct)
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error updating product:', error);
      throw new Error(`Failed to update product: ${error.message}`);
    }

    // Return the updated product
    return this.getProductById(id);
  },

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_products')
      .delete()
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  },

  /**
   * Get product inventory statistics
   */
  async getInventoryStats(): Promise<{
    totalProducts: number;
    totalValue: number;
    categoryCounts: { category: string; count: number; value: number }[];
    vendorCounts: { vendorId: string; vendorName: string; count: number; value: number }[];
  }> {
    const { data, error } = await supabase
      .from('gl_products')
      .select(`
        *,
        account:rowid_accounts(id, account_name)
      `);

    if (error) {
      console.error('Error fetching inventory stats:', error);
      throw new Error(`Failed to fetch inventory stats: ${error.message}`);
    }

    // Calculate total products and value
    const products = data as unknown as GlProductRecord[];
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => {
      return sum + (product.cost || 0) * (product.total_qty_purchased || 0);
    }, 0);

    // Calculate category counts and values
    const categoryMap = new Map<string, { count: number; value: number }>();
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      const value = (product.cost || 0) * (product.total_qty_purchased || 0);
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 0, value: 0 });
      }
      
      const current = categoryMap.get(category)!;
      categoryMap.set(category, {
        count: current.count + 1,
        value: current.value + value
      });
    });

    const categoryCounts = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      value: stats.value
    }));

    // Calculate vendor counts and values
    const vendorMap = new Map<string, { vendorName: string; count: number; value: number }>();
    products.forEach(product => {
      if (!product.rowid_accounts) return;
      
      const vendorId = product.rowid_accounts;
      const vendorName = product.account?.account_name || 'Unknown Vendor';
      const value = (product.cost || 0) * (product.total_qty_purchased || 0);
      
      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, { vendorName, count: 0, value: 0 });
      }
      
      const current = vendorMap.get(vendorId)!;
      vendorMap.set(vendorId, {
        vendorName,
        count: current.count + 1,
        value: current.value + value
      });
    });

    const vendorCounts = Array.from(vendorMap.entries()).map(([vendorId, stats]) => ({
      vendorId,
      vendorName: stats.vendorName,
      count: stats.count,
      value: stats.value
    }));

    return {
      totalProducts,
      totalValue,
      categoryCounts,
      vendorCounts
    };
  },

  /**
   * Subscribe to product changes
   */
  subscribeToProductChanges(callback: (payload: any) => void) {
    return supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gl_products' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  },

  /**
   * Search products by text query
   */
  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('gl_products')
      .select(`
        *,
        account:rowid_accounts(id, account_name, account_type)
      `)
      .or(
        `vendor_product_name.ilike.%${query}%,new_product_name.ilike.%${query}%,category.ilike.%${query}%,display_name.ilike.%${query}%`
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching products:', error);
      throw new Error(`Failed to search products: ${error.message}`);
    }

    // Transform the data to match our Product interface
    return (data as unknown as GlProductRecord[]).map(item => {
      const product: Product = {
        id: item.id,
        glide_row_id: item.glide_row_id,
        display_name: item.display_name || item.new_product_name || item.vendor_product_name || 'Unnamed Product',
        new_product_name: item.new_product_name,
        vendor_product_name: item.vendor_product_name,
        rowid_accounts: item.rowid_accounts,
        vendorName: item.account?.account_name,
        vendorId: item.rowid_accounts,
        rowid_vendor_payments: item.rowid_vendor_payments,
        rowid_purchase_orders: item.rowid_purchase_orders,
        purchaseOrderId: item.rowid_purchase_orders,
        category: item.category,
        cost: item.cost || 0, // Default to 0 if null (required field)
        total_qty_purchased: item.total_qty_purchased || 0, // Default to 0 if null (required field)
        samples: item.is_sample,
        fronted: item.is_fronted,
        miscellaneous_items: item.is_miscellaneous,
        terms_for_fronted_product: item.terms_for_fronted_product,
        total_units_behind_sample: item.total_units_behind_sample,
        product_purchase_date: item.date_of_purchase ? new Date(item.date_of_purchase) : null,
        purchaseDate: item.date_of_purchase ? new Date(item.date_of_purchase) : null,
        purchase_notes: item.purchase_note,
        product_image1: item.product_image1,
        created_at: item.created_at,
        updated_at: item.updated_at,
        // Derived flags
        isSample: item.is_sample,
        isFronted: item.is_fronted,
        isMiscellaneous: item.is_miscellaneous,
        // Alias fields
        name: item.display_name || item.new_product_name || item.vendor_product_name || 'Unnamed Product',
        quantity: item.total_qty_purchased || 0
      };
      return product;
    });
  }
};
