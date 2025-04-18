
import { supabase } from '@/integrations/supabase/client';
import * as Types from '@/services/types';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

export const InvoicesService = {
  /**
   * Fetch a single invoice by ID
   */
  async getById(id: string): Promise<Types.Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('gl_invoices')
        .select(`
          *,
          gl_accounts!customer_id(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching invoice:', error);
        return null;
      }
      
      return data ? Types.convertToInvoice(data) : null;
    } catch (error) {
      console.error('Exception fetching invoice:', error);
      return null;
    }
  },

  /**
   * Fetch invoices with optional filters
   */
  async getInvoices(
    filters?: Types.InvoiceFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Types.Invoice[], count: number }> {
    try {
      let query = supabase
        .from('gl_invoices')
        .select(`
          *,
          gl_accounts!customer_id(*),
          invoice_lines(*)
        `, { count: 'exact' });
      
      // Apply filters
      query = this.applyFilters(query, filters);
      
      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) {
        console.error('Error fetching invoices:', error);
        return { data: [], count: 0 };
      }
      
      return {
        data: data ? data.map(invoice => Types.convertToInvoice(invoice)) : [],
        count: count || 0
      };
    } catch (error) {
      console.error('Exception fetching invoices:', error);
      return { data: [], count: 0 };
    }
  },
  
  /**
   * Create a new invoice
   */
  async createInvoice(invoice: Types.InvoiceForm): Promise<Types.Invoice | null> {
    try {
      const insertData = Types.convertToGlInvoiceInsert(invoice);
      
      const { data, error } = await supabase
        .from('gl_invoices')
        .insert(insertData)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating invoice:', error);
        return null;
      }
      
      return data ? Types.convertToInvoice(data) : null;
    } catch (error) {
      console.error('Exception creating invoice:', error);
      return null;
    }
  },
  
  /**
   * Update an existing invoice
   */
  async updateInvoice(id: string, updates: Partial<Types.Invoice>): Promise<Types.Invoice | null> {
    try {
      // Convert updates to database format
      const updateData = Types.convertToGlInvoiceInsert(updates as Types.Invoice);
      
      const { data, error } = await supabase
        .from('gl_invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating invoice:', error);
        return null;
      }
      
      return data ? Types.convertToInvoice(data) : null;
    } catch (error) {
      console.error('Exception updating invoice:', error);
      return null;
    }
  },
  
  /**
   * Delete an invoice by ID
   */
  async deleteInvoice(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('gl_invoices')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting invoice:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception deleting invoice:', error);
      return false;
    }
  },
  
  /**
   * Update invoice PDF URL
   */
  async updatePdfUrl(id: string, pdfUrl: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('gl_invoices')
        .update({
          supabase_pdf_url: pdfUrl,
          last_pdf_generated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) {
        console.error('Error updating invoice PDF URL:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception updating invoice PDF URL:', error);
      return false;
    }
  },

  /**
   * Apply filters to the query
   */
  applyFilters(
    query: PostgrestFilterBuilder<any>,
    filters?: Types.InvoiceFilters
  ): PostgrestFilterBuilder<any> {
    if (!filters) return query;
    
    if (filters.searchTerm) {
      query = query.or(
        `invoice_uid.ilike.%${filters.searchTerm}%,invoice_number.ilike.%${filters.searchTerm}%`
      );
    }
    
    if (filters.startDate) {
      query = query.gte('invoice_date', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('invoice_date', filters.endDate);
    }
    
    if (filters.customerIds && filters.customerIds.length > 0) {
      query = query.in('customer_id', filters.customerIds);
    }
    
    if (filters.invoiceStatus && filters.invoiceStatus.length > 0) {
      query = query.in('invoice_status', filters.invoiceStatus);
    }
    
    if (filters.paymentStatus && filters.paymentStatus.length > 0) {
      query = query.in('payment_status', filters.paymentStatus);
    }
    
    if (filters.isPaid !== undefined) {
      query = query.eq('is_paid', filters.isPaid);
    }
    
    return query;
  }
};
