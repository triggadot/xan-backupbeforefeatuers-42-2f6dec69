import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_inventory_view table
 */

// Database schema type matching Supabase gl_inventory_view table
export interface GlInventoryRecord {
  id: string;
  glide_row_id: string;
  product_name: string;
  vendor_name?: string;
  vendor_uid?: string;
  category?: string;
  product_sku?: string;
  total_qty_purchased?: number;
  cost?: number;
  total_cost?: number;
  is_sample_or_fronted?: boolean;
  is_fronted?: boolean;
  is_sample?: boolean;
  date_of_purchase?: string;
  qty_in_stock?: number;
  qty_committed?: number;
  qty_sold?: number;
  qty_available?: number;
  total_revenue?: number;
  total_profit?: number;
  margin_percentage?: number;
  purchase_order_uid?: string;
  po_balance?: number;
  po_date?: string;
  vendor_payments_amount?: number;
  vendor_balance_impact?: number;
  days_in_inventory?: number;
  days_since_last_sale?: number;
  inventory_turnover_rate?: number;
  rowid_accounts?: string;
  rowid_purchase_orders?: string;
  rowid_vendor_payments?: string;
  purchase_note?: string;
  public_url_image?: string;
  public_url_video?: string;
  last_sale_date?: string;
  last_payment_date?: string;
  created_at: string;
  updated_at: string;
}

// Frontend filter interface
export interface InventoryFilters {
  category?: string;
  vendor?: string;
  search?: string;
  minStock?: number;
  maxStock?: number;
  minProfit?: number;
  isInStock?: boolean;
  isSample?: boolean;
  isFronted?: boolean;
  isMiscellaneous?: boolean;
  sortBy?: 'product_name' | 'qty_in_stock' | 'total_profit' | 'margin_percentage' | 'days_in_inventory';
  sortDirection?: 'asc' | 'desc';
}

// Inventory statistics interface
export interface InventoryStats {
  totalProducts: number;
  totalValue?: number;
  lowStockCount?: number;
  categoryCounts?: Array<{
    category: string;
    count: number;
    value: number;
  }>;
  vendorCounts?: Array<{
    vendorName: string;
    count: number;
    value: number;
  }>;
  highPerformers?: Array<{
    id: string;
    product_name: string;
    margin_percentage: number;
    total_profit: number;
  }>;
  inventoryHealth?: {
    healthy: number;
    warning: number;
    critical: number;
  };
}

/**
 * Process category data into statistics
 */
function processCategoryData(data: any[] = []) {
  // Create a map of categories with their counts and values
  const categoryMap = data.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { category, count: 0, value: 0 };
    }
    acc[category].count++;
    acc[category].value += (item.total_cost || 0);
    return acc;
  }, {} as Record<string, { category: string, count: number, value: number }>);

  // Convert to array and sort by count
  return Object.values(categoryMap).sort((a, b) => b.count - a.count);
}

/**
 * Process vendor data into statistics
 */
function processVendorData(data: any[] = []) {
  // Create a map of vendors with their counts and values
  const vendorMap = data.reduce((acc, item) => {
    const vendorName = item.vendor_name || 'Unknown';
    if (!acc[vendorName]) {
      acc[vendorName] = { vendorName, count: 0, value: 0 };
    }
    acc[vendorName].count++;
    acc[vendorName].value += (item.total_cost || 0);
    return acc;
  }, {} as Record<string, { vendorName: string, count: number, value: number }>);

  // Convert to array and sort by count
  return Object.values(vendorMap).sort((a, b) => b.count - a.count);
}

/**
 * Inventory view service for Supabase operations
 * Provides methods to query and analyze inventory data
 */
export const glInventoryViewsService = {
  /**
   * Get all inventory items with optional filtering
   */
  async getInventoryItems(filters: InventoryFilters = {}): Promise<GlInventoryRecord[]> {
    // Type assertion to handle Supabase table typing issue
    let query = supabase
      .from('gl_inventory_view' as any)
      .select('*');

    // Apply filters
    if (filters.search) {
      query = query.or(`product_name.ilike.%${filters.search}%,product_sku.ilike.%${filters.search}%,vendor_name.ilike.%${filters.search}%`);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.vendor) {
      query = query.eq('vendor_name', filters.vendor);
    }

    if (filters.minStock !== undefined) {
      query = query.gte('qty_in_stock', filters.minStock);
    }

    if (filters.maxStock !== undefined) {
      query = query.lte('qty_in_stock', filters.maxStock);
    }

    if (filters.minProfit !== undefined) {
      query = query.gte('total_profit', filters.minProfit);
    }

    if (filters.isInStock) {
      query = query.gt('qty_available', 0);
    }

    if (filters.isSample) {
      query = query.eq('is_sample', true);
    }

    if (filters.isFronted) {
      query = query.eq('is_fronted', true);
    }

    if (filters.isMiscellaneous) {
      query = query.or('category.is.null,category.eq.Miscellaneous');
    }

    // Apply sorting
    if (filters.sortBy) {
      const direction = filters.sortDirection || 'asc';
      query = query.order(filters.sortBy, { ascending: direction === 'asc' });
    } else {
      query = query.order('product_name', { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching inventory items:', error);
      throw new Error(`Error fetching inventory items: ${error.message}`);
    }

    return data as GlInventoryRecord[];
  },

  /**
   * Get a single inventory item by ID
   */
  async getInventoryItemById(id: string): Promise<GlInventoryRecord> {
    const { data, error } = await supabase
      .from('gl_inventory_view')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching inventory item:', error);
      throw new Error(`Error fetching inventory item: ${error.message}`);
    }

    if (!data) {
      throw new Error('Inventory item not found');
    }

    return data;
  },

  /**
   * Get inventory statistics
   */
  async getInventoryStats(): Promise<InventoryStats> {
    // Fetch overall inventory statistics using type assertion
    const { data: totalProducts, error: countError } = await supabase
      .from('gl_inventory_view' as any)
      .select('id', { count: 'exact' });
      
    if (countError) {
      console.error('Error fetching inventory count:', countError);
      return { totalProducts: 0 };
    }

    // Get category distribution with type assertion
    const { data: categoryData, error: categoryError } = await supabase
      .from('gl_inventory_view' as any)
      .select('*');

    if (categoryError) {
      console.error('Error fetching category stats:', categoryError);
      return { totalProducts: totalProducts?.length || 0 };
    }

    // Get vendor distribution with type assertion
    const { data: vendorData, error: vendorError } = await supabase
      .from('gl_inventory_view' as any)
      .select('*');

    if (vendorError) {
      console.error('Error fetching vendor stats:', vendorError);
      return { 
        totalProducts: totalProducts?.length || 0,
        categoryCounts: processCategoryData(categoryData)
      };
    }

    // Calculate total inventory value
    const totalValue = (categoryData as any[]).reduce((sum, item) => sum + (item.total_cost || 0), 0);

    // Count low stock items (less than 5 items)
    const lowStockCount = (categoryData as any[]).filter(item => (item.qty_in_stock || 0) < 5).length;

    // Process category data
    const categoryCounts = processCategoryData(categoryData);

    // Process vendor data
    const vendorCounts = processVendorData(vendorData);

    // Get top performers by profit margin
    const highPerformers = (categoryData as any[])
      .filter(item => item.margin_percentage !== undefined && item.total_profit !== undefined)
      .sort((a, b) => (b.margin_percentage || 0) - (a.margin_percentage || 0))
      .slice(0, 5)
      .map(item => ({
        id: item.id,
        product_name: item.product_name || '',
        margin_percentage: item.margin_percentage || 0,
        total_profit: item.total_profit || 0
      }));

    // Classify inventory health
    const healthyItems = (categoryData as any[]).filter(item => (item.days_in_inventory || 0) < 30).length;
    const warningItems = (categoryData as any[]).filter(item => 
      (item.days_in_inventory || 0) >= 30 && (item.days_in_inventory || 0) < 90
    ).length;
    const criticalItems = (categoryData as any[]).filter(item => (item.days_in_inventory || 0) >= 90).length;

    return {
      totalProducts: totalProducts?.length || 0,
      totalValue,
      lowStockCount,
      categoryCounts,
      vendorCounts,
      highPerformers,
      inventoryHealth: {
        healthy: healthyItems,
        warning: warningItems,
        critical: criticalItems
      }
    };
  },

  /**
   * Get unique categories from inventory
   */
  async getInventoryCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('gl_inventory_view' as any)
      .select('category')
      .not('category', 'is', null)
      .order('category');

    if (error) {
      console.error('Error fetching inventory categories:', error);
      throw new Error(`Error fetching inventory categories: ${error.message}`);
    }

    // Get unique categories
    const categories = [...new Set((data as any[]).map(item => item.category))].filter(Boolean) as string[];
    return categories;
  },

  /**
   * Get unique vendors from inventory
   */
  async getInventoryVendors(): Promise<string[]> {
    const { data, error } = await supabase
      .from('gl_inventory_view' as any)
      .select('vendor_name')
      .not('vendor_name', 'is', null)
      .order('vendor_name');

    if (error) {
      console.error('Error fetching inventory vendors:', error);
      throw new Error(`Error fetching inventory vendors: ${error.message}`);
    }

    // Get unique vendors
    const vendors = [...new Set((data as any[]).map(item => item.vendor_name))].filter(Boolean) as string[];
    return vendors;
  },

  /**
   * Subscribe to changes in inventory items
   */
  subscribeToInventoryChanges(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('gl_inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gl_inventory_view' as any }, payload => {
        callback(payload);
      })
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription);
    };
  }
};

export default glInventoryService;
