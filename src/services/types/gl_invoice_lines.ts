import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_invoice_lines table
 */

// Database schema type matching Supabase gl_invoice_lines table
export interface GlInvoiceLineRecord {
  id: string;
  glide_row_id: string;
  renamed_product_name?: string;
  date_of_sale?: string;
  rowid_invoices?: string;
  rowid_products?: string;
  qty_sold?: number;
  selling_price?: number;
  sale_note?: string;
  user_email_of_added?: string;
  created_at: string;
  updated_at: string;
  line_total?: number;
  product_name_display?: string;
}

// Type for database insert/update operations
export interface GlInvoiceLineInsert {
  glide_row_id: string;
  renamed_product_name?: string;
  date_of_sale?: string;
  rowid_invoices?: string;
  rowid_products?: string;
  qty_sold?: number;
  selling_price?: number;
  sale_note?: string;
  user_email_of_added?: string;
}

// Frontend filter interface
export interface InvoiceLineFilters {
  invoiceId?: string;
  productId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Form data for creating/updating invoice lines
export interface InvoiceLineForm {
  renamedProductName?: string;
  dateOfSale?: Date;
  invoiceId?: string;
  productId?: string;
  qtySold?: number;
  sellingPrice?: number;
  saleNote?: string;
  userEmailOfAdded?: string;
}

// Invoice line model for frontend use
export interface InvoiceLine {
  id: string;
  glide_row_id: string;
  renamed_product_name?: string;
  date_of_sale?: string;
  rowid_invoices?: string;
  rowid_products?: string;
  qty_sold?: number;
  selling_price?: number;
  sale_note?: string;
  user_email_of_added?: string;
  created_at: string;
  updated_at: string;
  line_total?: number;
  product_name_display?: string;
}

/**
 * Invoice Lines service for Supabase operations
 * Handles CRUD operations for gl_invoice_lines table
 */
export const glInvoiceLinesService = {
  /**
   * Get all invoice lines with optional filtering
   */
  async getInvoiceLines(filters: InvoiceLineFilters = {}): Promise<InvoiceLine[]> {
    let query = supabase
      .from('gl_invoice_lines')
      .select('*');

    // Apply filters
    if (filters.invoiceId) {
      query = query.eq('rowid_invoices', filters.invoiceId);
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
        `renamed_product_name.ilike.%${filters.search}%,sale_note.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoice lines:', error);
      throw new Error(`Failed to fetch invoice lines: ${error.message}`);
    }

    return (data as unknown as GlInvoiceLineRecord[]).map(item => {
      const line: InvoiceLine = {
        id: item.id,
        glide_row_id: item.glide_row_id,
        renamed_product_name: item.renamed_product_name,
        date_of_sale: item.date_of_sale,
        rowid_invoices: item.rowid_invoices,
        rowid_products: item.rowid_products,
        qty_sold: item.qty_sold,
        selling_price: item.selling_price,
        sale_note: item.sale_note,
        user_email_of_added: item.user_email_of_added,
        created_at: item.created_at,
        updated_at: item.updated_at,
        line_total: item.line_total,
        product_name_display: item.product_name_display,
      };
      return line;
    });
  },

  /**
   * Get a single invoice line by ID
   */
  async getInvoiceLineById(id: string): Promise<InvoiceLine> {
    const { data, error } = await supabase
      .from('gl_invoice_lines')
      .select('*')
      .eq('glide_row_id', id)
      .single();

    if (error) {
      console.error('Error fetching invoice line:', error);
      throw new Error(`Failed to fetch invoice line: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Invoice line with ID ${id} not found`);
    }

    const item = data as unknown as GlInvoiceLineRecord;
    const line: InvoiceLine = {
      id: item.id,
      glide_row_id: item.glide_row_id,
      renamed_product_name: item.renamed_product_name,
      date_of_sale: item.date_of_sale,
      rowid_invoices: item.rowid_invoices,
      rowid_products: item.rowid_products,
      qty_sold: item.qty_sold,
      selling_price: item.selling_price,
      sale_note: item.sale_note,
      user_email_of_added: item.user_email_of_added,
      created_at: item.created_at,
      updated_at: item.updated_at,
      line_total: item.line_total,
      product_name_display: item.product_name_display,
    };

    return line;
  },

  /**
   * Create a new invoice line
   */
  async createInvoiceLine(lineData: InvoiceLineForm): Promise<InvoiceLine> {
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const dbLine: GlInvoiceLineInsert = {
      glide_row_id: uuid,
      renamed_product_name: lineData.renamedProductName,
      date_of_sale: lineData.dateOfSale?.toISOString(),
      rowid_invoices: lineData.invoiceId,
      rowid_products: lineData.productId,
      qty_sold: lineData.qtySold,
      selling_price: lineData.sellingPrice,
      sale_note: lineData.saleNote,
      user_email_of_added: lineData.userEmailOfAdded,
    };

    const { data, error } = await supabase
      .from('gl_invoice_lines')
      .insert(dbLine)
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice line:', error);
      throw new Error(`Failed to create invoice line: ${error.message}`);
    }

    return this.getInvoiceLineById(data.glide_row_id);
  },

  /**
   * Update an existing invoice line
   */
  async updateInvoiceLine(id: string, lineData: Partial<InvoiceLineForm>): Promise<InvoiceLine> {
    const dbLine: Partial<GlInvoiceLineInsert> = {};

    if (lineData.renamedProductName !== undefined) dbLine.renamed_product_name = lineData.renamedProductName;
    if (lineData.dateOfSale !== undefined) dbLine.date_of_sale = lineData.dateOfSale?.toISOString();
    if (lineData.invoiceId !== undefined) dbLine.rowid_invoices = lineData.invoiceId;
    if (lineData.productId !== undefined) dbLine.rowid_products = lineData.productId;
    if (lineData.qtySold !== undefined) dbLine.qty_sold = lineData.qtySold;
    if (lineData.sellingPrice !== undefined) dbLine.selling_price = lineData.sellingPrice;
    if (lineData.saleNote !== undefined) dbLine.sale_note = lineData.saleNote;
    if (lineData.userEmailOfAdded !== undefined) dbLine.user_email_of_added = lineData.userEmailOfAdded;

    const { error } = await supabase
      .from('gl_invoice_lines')
      .update(dbLine)
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error updating invoice line:', error);
      throw new Error(`Failed to update invoice line: ${error.message}`);
    }

    return this.getInvoiceLineById(id);
  },

  /**
   * Delete an invoice line
   */
  async deleteInvoiceLine(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_invoice_lines')
      .delete()
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error deleting invoice line:', error);
      throw new Error(`Failed to delete invoice line: ${error.message}`);
    }
  },

  /**
   * Subscribe to invoice line changes
   */
  subscribeToInvoiceLineChanges(callback: (payload: any) => void) {
    return supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gl_invoice_lines' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }
};
