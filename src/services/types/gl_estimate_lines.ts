import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_estimate_lines table
 */

// Database schema type matching Supabase gl_estimate_lines table
export interface GlEstimateLineRecord {
  id: string;
  glide_row_id: string;
  rowid_estimates?: string;
  rowid_products?: string;
  date_of_sale?: string;
  sale_product_name?: string;
  selling_price?: number;
  total_stock_after_sell?: number;
  qty_sold?: number;
  sale_note?: string;
  created_at: string;
  updated_at: string;
  line_total?: number;
  product_name_display?: string;
}

// Type for database insert/update operations
export interface GlEstimateLineInsert {
  glide_row_id: string;
  rowid_estimates?: string;
  rowid_products?: string;
  date_of_sale?: string;
  sale_product_name?: string;
  selling_price?: number;
  total_stock_after_sell?: number;
  qty_sold?: number;
  sale_note?: string;
}

// Frontend filter interface
export interface EstimateLineFilters {
  estimateId?: string;
  productId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Form data for creating/updating estimate lines
export interface EstimateLineForm {
  estimateId?: string;
  productId?: string;
  dateOfSale?: Date;
  saleProductName?: string;
  sellingPrice?: number;
  totalStockAfterSell?: number;
  qtySold?: number;
  saleNote?: string;
}

// Estimate line model for frontend use
export interface EstimateLine {
  id: string;
  glide_row_id: string;
  rowid_estimates?: string;
  rowid_products?: string;
  date_of_sale?: string;
  sale_product_name?: string;
  selling_price?: number;
  total_stock_after_sell?: number;
  qty_sold?: number;
  sale_note?: string;
  created_at: string;
  updated_at: string;
  line_total?: number;
  product_name_display?: string;
}

/**
 * Estimate Lines service for Supabase operations
 * Handles CRUD operations for gl_estimate_lines table
 */
export const glEstimateLinesService = {
  /**
   * Get all estimate lines with optional filtering
   */
  async getEstimateLines(filters: EstimateLineFilters = {}): Promise<EstimateLine[]> {
    let query = supabase
      .from('gl_estimate_lines')
      .select('*');

    // Apply filters
    if (filters.estimateId) {
      query = query.eq('rowid_estimates', filters.estimateId);
    }
    if (filters.productId) {
      query = query.eq('rowid_products', filters.productId);
    }
    if (filters.dateFrom) {
      query = query.gte('date_of_sale', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('date_of_sale', filters.dateTo.toISOString());
    }
    if (filters.search) {
      query = query.or(
        `sale_product_name.ilike.%${filters.search}%,sale_note.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching estimate lines:', error);
      throw new Error(`Failed to fetch estimate lines: ${error.message}`);
    }

    return (data as unknown as GlEstimateLineRecord[]).map(item => {
      const line: EstimateLine = {
        id: item.id,
        glide_row_id: item.glide_row_id,
        rowid_estimates: item.rowid_estimates,
        rowid_products: item.rowid_products,
        date_of_sale: item.date_of_sale,
        sale_product_name: item.sale_product_name,
        selling_price: item.selling_price,
        total_stock_after_sell: item.total_stock_after_sell,
        qty_sold: item.qty_sold,
        sale_note: item.sale_note,
        created_at: item.created_at,
        updated_at: item.updated_at,
        line_total: item.line_total,
        product_name_display: item.product_name_display,
      };
      return line;
    });
  },

  /**
   * Get a single estimate line by ID
   */
  async getEstimateLineById(id: string): Promise<EstimateLine> {
    const { data, error } = await supabase
      .from('gl_estimate_lines')
      .select('*')
      .eq('glide_row_id', id)
      .single();

    if (error) {
      console.error('Error fetching estimate line:', error);
      throw new Error(`Failed to fetch estimate line: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Estimate line with ID ${id} not found`);
    }

    const item = data as unknown as GlEstimateLineRecord;
    const line: EstimateLine = {
      id: item.id,
      glide_row_id: item.glide_row_id,
      rowid_estimates: item.rowid_estimates,
      rowid_products: item.rowid_products,
      date_of_sale: item.date_of_sale,
      sale_product_name: item.sale_product_name,
      selling_price: item.selling_price,
      total_stock_after_sell: item.total_stock_after_sell,
      qty_sold: item.qty_sold,
      sale_note: item.sale_note,
      created_at: item.created_at,
      updated_at: item.updated_at,
      line_total: item.line_total,
      product_name_display: item.product_name_display,
    };

    return line;
  },

  /**
   * Create a new estimate line
   */
  async createEstimateLine(lineData: EstimateLineForm): Promise<EstimateLine> {
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const dbLine: GlEstimateLineInsert = {
      glide_row_id: uuid,
      rowid_estimates: lineData.estimateId,
      rowid_products: lineData.productId,
      date_of_sale: lineData.dateOfSale?.toISOString(),
      sale_product_name: lineData.saleProductName,
      selling_price: lineData.sellingPrice,
      total_stock_after_sell: lineData.totalStockAfterSell,
      qty_sold: lineData.qtySold,
      sale_note: lineData.saleNote,
    };

    const { data, error } = await supabase
      .from('gl_estimate_lines')
      .insert(dbLine)
      .select()
      .single();

    if (error) {
      console.error('Error creating estimate line:', error);
      throw new Error(`Failed to create estimate line: ${error.message}`);
    }

    return this.getEstimateLineById(data.glide_row_id);
  },

  /**
   * Update an existing estimate line
   */
  async updateEstimateLine(id: string, lineData: Partial<EstimateLineForm>): Promise<EstimateLine> {
    const dbLine: Partial<GlEstimateLineInsert> = {};

    if (lineData.estimateId !== undefined) dbLine.rowid_estimates = lineData.estimateId;
    if (lineData.productId !== undefined) dbLine.rowid_products = lineData.productId;
    if (lineData.dateOfSale !== undefined) dbLine.date_of_sale = lineData.dateOfSale?.toISOString();
    if (lineData.saleProductName !== undefined) dbLine.sale_product_name = lineData.saleProductName;
    if (lineData.sellingPrice !== undefined) dbLine.selling_price = lineData.sellingPrice;
    if (lineData.totalStockAfterSell !== undefined) dbLine.total_stock_after_sell = lineData.totalStockAfterSell;
    if (lineData.qtySold !== undefined) dbLine.qty_sold = lineData.qtySold;
    if (lineData.saleNote !== undefined) dbLine.sale_note = lineData.saleNote;

    const { error } = await supabase
      .from('gl_estimate_lines')
      .update(dbLine)
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error updating estimate line:', error);
      throw new Error(`Failed to update estimate line: ${error.message}`);
    }

    return this.getEstimateLineById(id);
  },

  /**
   * Delete an estimate line
   */
  async deleteEstimateLine(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_estimate_lines')
      .delete()
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error deleting estimate line:', error);
      throw new Error(`Failed to delete estimate line: ${error.message}`);
    }
  },

  /**
   * Subscribe to estimate line changes
   */
  subscribeToEstimateLineChanges(callback: (payload: any) => void) {
    return supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gl_estimate_lines' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }
};
