import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_estimates table
 */

// Database schema type matching Supabase gl_estimates table
export interface GlEstimateRecord {
  id: string;
  glide_row_id: string;
  rowid_invoices?: string;
  rowid_accounts?: string;
  estimate_date?: string;
  is_a_sample?: boolean;
  date_invoice_created?: string;
  is_note_added?: boolean;
  is_invoice_created?: boolean;
  glide_pdf_url?: string;
  glide_pdf_url_secondary?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  total_amount?: number;
  total_credits?: number;
  balance?: number;
  estimate_uid?: string;
  status?: string;
  supabase_pdf_url?: string;
  date_of_invoice?: string;
}

// Type for database insert/update operations
export interface GlEstimateInsert {
  glide_row_id: string;
  rowid_invoices?: string;
  rowid_accounts?: string;
  estimate_date?: string;
  is_a_sample?: boolean;
  date_invoice_created?: string;
  is_note_added?: boolean;
  is_invoice_created?: boolean;
  glide_pdf_url?: string;
  glide_pdf_url_secondary?: string;
  notes?: string;
  total_amount?: number;
  total_credits?: number;
  balance?: number;
  estimate_uid?: string;
  status?: string;
  supabase_pdf_url?: string;
  date_of_invoice?: string;
}

// Frontend filter interface
export interface EstimateFilters {
  accountId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Form data for creating/updating estimates
export interface EstimateForm {
  accountId?: string;
  rowidInvoices?: string;
  estimateDate?: Date;
  isASample?: boolean;
  dateInvoiceCreated?: Date;
  isNoteAdded?: boolean;
  isInvoiceCreated?: boolean;
  glidePdfUrl?: string;
  glidePdfUrlSecondary?: string;
  notes?: string;
  totalAmount?: number;
  totalCredits?: number;
  balance?: number;
  estimateUid?: string;
  status?: string;
  supabasePdfUrl?: string;
  invoiceOrderDate?: Date;
}

// Estimate model for frontend use
export interface Estimate {
  id: string;
  glide_row_id: string;
  rowid_invoices?: string;
  rowid_accounts?: string;
  estimate_date?: string;
  is_a_sample?: boolean;
  date_invoice_created?: string;
  is_note_added?: boolean;
  is_invoice_created?: boolean;
  glide_pdf_url?: string;
  glide_pdf_url_secondary?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  total_amount?: number;
  total_credits?: number;
  balance?: number;
  estimate_uid?: string;
  status?: string;
  supabase_pdf_url?: string;
  date_of_invoice?: string;
}

/**
 * Estimates service for Supabase operations
 * Handles CRUD operations for gl_estimates table
 */
export const glEstimatesService = {
  /**
   * Get all estimates with optional filtering
   */
  async getEstimates(filters: EstimateFilters = {}): Promise<Estimate[]> {
    let query = supabase
      .from('gl_estimates')
      .select('*');

    // Apply filters
    if (filters.accountId) {
      query = query.eq('rowid_accounts', filters.accountId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.dateFrom) {
      query = query.gte('estimate_date', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('estimate_date', filters.dateTo.toISOString());
    }
    if (filters.search) {
      query = query.or(
        `estimate_uid.ilike.%${filters.search}%,status.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching estimates:', error);
      throw new Error(`Failed to fetch estimates: ${error.message}`);
    }

    return (data as unknown as GlEstimateRecord[]).map(item => {
      const estimate: Estimate = {
        id: item.id,
        glide_row_id: item.glide_row_id,
        rowid_invoices: item.rowid_invoices,
        rowid_accounts: item.rowid_accounts,
        estimate_date: item.estimate_date,
        is_a_sample: item.is_a_sample,
        date_invoice_created: item.date_invoice_created,
        is_note_added: item.is_note_added,
        is_invoice_created: item.is_invoice_created,
        glide_pdf_url: item.glide_pdf_url,
        glide_pdf_url_secondary: item.glide_pdf_url_secondary,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        total_amount: item.total_amount,
        total_credits: item.total_credits,
        balance: item.balance,
        estimate_uid: item.estimate_uid,
        status: item.status,
        supabase_pdf_url: item.supabase_pdf_url,
        date_of_invoice: item.date_of_invoice,
      };
      return estimate;
    });
  },

  /**
   * Get a single estimate by ID
   */
  async getEstimateById(id: string): Promise<Estimate> {
    const { data, error } = await supabase
      .from('gl_estimates')
      .select('*')
      .eq('glide_row_id', id)
      .single();

    if (error) {
      console.error('Error fetching estimate:', error);
      throw new Error(`Failed to fetch estimate: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Estimate with ID ${id} not found`);
    }

    const item = data as unknown as GlEstimateRecord;
    const estimate: Estimate = {
      id: item.id,
      glide_row_id: item.glide_row_id,
      rowid_invoices: item.rowid_invoices,
      rowid_accounts: item.rowid_accounts,
      estimate_date: item.estimate_date,
      is_a_sample: item.is_a_sample,
      date_invoice_created: item.date_invoice_created,
      is_note_added: item.is_note_added,
      is_invoice_created: item.is_invoice_created,
      glide_pdf_url: item.glide_pdf_url,
      glide_pdf_url_secondary: item.glide_pdf_url_secondary,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
      total_amount: item.total_amount,
      total_credits: item.total_credits,
      balance: item.balance,
      estimate_uid: item.estimate_uid,
      status: item.status,
      supabase_pdf_url: item.supabase_pdf_url,
      date_of_invoice: item.date_of_invoice,
    };

    return estimate;
  },

  /**
   * Create a new estimate
   */
  async createEstimate(estimateData: EstimateForm): Promise<Estimate> {
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const dbEstimate: GlEstimateInsert = {
      glide_row_id: uuid,
      rowid_invoices: estimateData.rowidInvoices,
      rowid_accounts: estimateData.accountId,
      estimate_date: estimateData.estimateDate?.toISOString(),
      is_a_sample: estimateData.isASample,
      date_invoice_created: estimateData.dateInvoiceCreated?.toISOString(),
      is_note_added: estimateData.isNoteAdded,
      is_invoice_created: estimateData.isInvoiceCreated,
      glide_pdf_url: estimateData.glidePdfUrl,
      glide_pdf_url_secondary: estimateData.glidePdfUrlSecondary,
      notes: estimateData.notes,
      total_amount: estimateData.totalAmount,
      total_credits: estimateData.totalCredits,
      balance: estimateData.balance,
      estimate_uid: estimateData.estimateUid,
      status: estimateData.status,
      supabase_pdf_url: estimateData.supabasePdfUrl,
      date_of_invoice: estimateData.invoiceOrderDate?.toISOString(),
    };

    const { data, error } = await supabase
      .from('gl_estimates')
      .insert(dbEstimate)
      .select()
      .single();

    if (error) {
      console.error('Error creating estimate:', error);
      throw new Error(`Failed to create estimate: ${error.message}`);
    }

    return this.getEstimateById(data.glide_row_id);
  },

  /**
   * Update an existing estimate
   */
  async updateEstimate(id: string, estimateData: Partial<EstimateForm>): Promise<Estimate> {
    const dbEstimate: Partial<GlEstimateInsert> = {};

    if (estimateData.rowidInvoices !== undefined) dbEstimate.rowid_invoices = estimateData.rowidInvoices;
    if (estimateData.accountId !== undefined) dbEstimate.rowid_accounts = estimateData.accountId;
    if (estimateData.estimateDate !== undefined) dbEstimate.estimate_date = estimateData.estimateDate?.toISOString();
    if (estimateData.isASample !== undefined) dbEstimate.is_a_sample = estimateData.isASample;
    if (estimateData.dateInvoiceCreated !== undefined) dbEstimate.date_invoice_created = estimateData.dateInvoiceCreated?.toISOString();
    if (estimateData.isNoteAdded !== undefined) dbEstimate.is_note_added = estimateData.isNoteAdded;
    if (estimateData.isInvoiceCreated !== undefined) dbEstimate.is_invoice_created = estimateData.isInvoiceCreated;
    if (estimateData.glidePdfUrl !== undefined) dbEstimate.glide_pdf_url = estimateData.glidePdfUrl;
    if (estimateData.glidePdfUrlSecondary !== undefined) dbEstimate.glide_pdf_url_secondary = estimateData.glidePdfUrlSecondary;
    if (estimateData.notes !== undefined) dbEstimate.notes = estimateData.notes;
    if (estimateData.totalAmount !== undefined) dbEstimate.total_amount = estimateData.totalAmount;
    if (estimateData.totalCredits !== undefined) dbEstimate.total_credits = estimateData.totalCredits;
    if (estimateData.balance !== undefined) dbEstimate.balance = estimateData.balance;
    if (estimateData.estimateUid !== undefined) dbEstimate.estimate_uid = estimateData.estimateUid;
    if (estimateData.status !== undefined) dbEstimate.status = estimateData.status;
    if (estimateData.supabasePdfUrl !== undefined) dbEstimate.supabase_pdf_url = estimateData.supabasePdfUrl;
    if (estimateData.invoiceOrderDate !== undefined) dbEstimate.date_of_invoice = estimateData.invoiceOrderDate?.toISOString();

    const { error } = await supabase
      .from('gl_estimates')
      .update(dbEstimate)
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error updating estimate:', error);
      throw new Error(`Failed to update estimate: ${error.message}`);
    }

    return this.getEstimateById(id);
  },

  /**
   * Delete an estimate
   */
  async deleteEstimate(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_estimates')
      .delete()
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error deleting estimate:', error);
      throw new Error(`Failed to delete estimate: ${error.message}`);
    }
  },

  /**
   * Subscribe to estimate changes
   */
  subscribeToEstimateChanges(callback: (payload: any) => void) {
    return supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gl_estimates' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }
};
