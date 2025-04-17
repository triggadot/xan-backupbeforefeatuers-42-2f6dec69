import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_invoices table
 */

// Database schema type matching Supabase gl_invoices table
export interface GlInvoiceRecord {
  id: string;
  glide_row_id: string;
  rowid_accounts?: string;
  date_of_invoice?: string;
  created_timestamp?: string;
  submitted_timestamp?: string;
  user_email?: string;
  notes?: string;
  glide_pdf_url?: string;
  created_at: string;
  updated_at: string;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  payment_status?: string;
  invoice_uid?: string;
  supabase_pdf_url?: string;
  is_processed?: boolean;
}

// Type for database insert/update operations
export interface GlInvoiceInsert {
  glide_row_id: string;
  rowid_accounts?: string;
  date_of_invoice?: string;
  created_timestamp?: string;
  submitted_timestamp?: string;
  user_email?: string;
  notes?: string;
  glide_pdf_url?: string;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  payment_status?: string;
  invoice_uid?: string;
  supabase_pdf_url?: string;
  is_processed?: boolean;
}

// Frontend filter interface
export interface InvoiceFilters {
  accountId?: string;
  paymentStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Form data for creating/updating invoices
export interface InvoiceForm {
  accountId?: string;
  dateOfInvoice?: Date;
  createdTimestamp?: Date;
  submittedTimestamp?: Date;
  userEmail?: string;
  notes?: string;
  glidePdfUrl?: string;
  totalAmount?: number;
  totalPaid?: number;
  balance?: number;
  paymentStatus?: string;
  invoiceUid?: string;
  supabasePdfUrl?: string;
  isProcessed?: boolean;
}

// Invoice model for frontend use
export interface Invoice {
  id: string;
  glide_row_id: string;
  rowid_accounts?: string;
  date_of_invoice?: string;
  created_timestamp?: string;
  submitted_timestamp?: string;
  user_email?: string;
  notes?: string;
  glide_pdf_url?: string;
  created_at: string;
  updated_at: string;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  payment_status?: string;
  invoice_uid?: string;
  supabase_pdf_url?: string;
  is_processed?: boolean;
}

/**
 * Invoices service for Supabase operations
 * Handles CRUD operations for gl_invoices table
 */
export const glInvoicesService = {
  /**
   * Get a single invoice by glide_row_id
   */
  async getInvoiceByGlideRowId(glideRowId: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from('gl_invoices')
      .select('*')
      .eq('glide_row_id', glideRowId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Invoice not found');
    return data as Invoice;
  },
  /**
   * Get all invoices with optional filtering
   */
  async getInvoices(filters: InvoiceFilters = {}): Promise<Invoice[]> {
    let query = supabase
      .from('gl_invoices')
      .select('*');

    // Apply filters
    if (filters.accountId) {
      query = query.eq('rowid_accounts', filters.accountId);
    }
    if (filters.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus);
    }
    if (filters.dateFrom) {
      query = query.gte('date_of_invoice', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('date_of_invoice', filters.dateTo.toISOString());
    }
    if (filters.search) {
      query = query.or(
        `invoice_uid.ilike.%${filters.search}%,payment_status.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    return (data as unknown as GlInvoiceRecord[]).map(item => {
      const invoice: Invoice = {
        id: item.id,
        glide_row_id: item.glide_row_id,
        rowid_accounts: item.rowid_accounts,
        date_of_invoice: item.date_of_invoice,
        created_timestamp: item.created_timestamp,
        submitted_timestamp: item.submitted_timestamp,
        user_email: item.user_email,
        notes: item.notes,
        glide_pdf_url: item.glide_pdf_url,
        created_at: item.created_at,
        updated_at: item.updated_at,
        total_amount: item.total_amount,
        total_paid: item.total_paid,
        balance: item.balance,
        payment_status: item.payment_status,
        invoice_uid: item.invoice_uid,
        supabase_pdf_url: item.supabase_pdf_url,
        is_processed: item.is_processed,
      };
      return invoice;
    });
  },

  /**
   * Get a single invoice by ID
   */
  async getInvoiceById(id: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from('gl_invoices')
      .select('*')
      .eq('glide_row_id', id)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Invoice with ID ${id} not found`);
    }

    const item = data as unknown as GlInvoiceRecord;
    const invoice: Invoice = {
      id: item.id,
      glide_row_id: item.glide_row_id,
      rowid_accounts: item.rowid_accounts,
      date_of_invoice: item.date_of_invoice,
      created_timestamp: item.created_timestamp,
      submitted_timestamp: item.submitted_timestamp,
      user_email: item.user_email,
      notes: item.notes,
      glide_pdf_url: item.glide_pdf_url,
      created_at: item.created_at,
      updated_at: item.updated_at,
      total_amount: item.total_amount,
      total_paid: item.total_paid,
      balance: item.balance,
      payment_status: item.payment_status,
      invoice_uid: item.invoice_uid,
      supabase_pdf_url: item.supabase_pdf_url,
      is_processed: item.is_processed,
    };

    return invoice;
  },

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData: InvoiceForm): Promise<Invoice> {
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const dbInvoice: GlInvoiceInsert = {
      glide_row_id: uuid,
      rowid_accounts: invoiceData.accountId,
      date_of_invoice: invoiceData.dateOfInvoice?.toISOString(),
      created_timestamp: invoiceData.createdTimestamp?.toISOString(),
      submitted_timestamp: invoiceData.submittedTimestamp?.toISOString(),
      user_email: invoiceData.userEmail,
      notes: invoiceData.notes,
      glide_pdf_url: invoiceData.glidePdfUrl,
      total_amount: invoiceData.totalAmount,
      total_paid: invoiceData.totalPaid,
      balance: invoiceData.balance,
      payment_status: invoiceData.paymentStatus,
      invoice_uid: invoiceData.invoiceUid,
      supabase_pdf_url: invoiceData.supabasePdfUrl,
      is_processed: invoiceData.isProcessed,
    };

    const { data, error } = await supabase
      .from('gl_invoices')
      .insert(dbInvoice)
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    return this.getInvoiceById(data.glide_row_id);
  },

  /**
   * Update an existing invoice
   */
  async updateInvoice(id: string, invoiceData: Partial<InvoiceForm>): Promise<Invoice> {
    const dbInvoice: Partial<GlInvoiceInsert> = {};

    if (invoiceData.accountId !== undefined) dbInvoice.rowid_accounts = invoiceData.accountId;
    if (invoiceData.dateOfInvoice !== undefined) dbInvoice.date_of_invoice = invoiceData.dateOfInvoice?.toISOString();
    if (invoiceData.createdTimestamp !== undefined) dbInvoice.created_timestamp = invoiceData.createdTimestamp?.toISOString();
    if (invoiceData.submittedTimestamp !== undefined) dbInvoice.submitted_timestamp = invoiceData.submittedTimestamp?.toISOString();
    if (invoiceData.userEmail !== undefined) dbInvoice.user_email = invoiceData.userEmail;
    if (invoiceData.notes !== undefined) dbInvoice.notes = invoiceData.notes;
    if (invoiceData.glidePdfUrl !== undefined) dbInvoice.glide_pdf_url = invoiceData.glidePdfUrl;
    if (invoiceData.totalAmount !== undefined) dbInvoice.total_amount = invoiceData.totalAmount;
    if (invoiceData.totalPaid !== undefined) dbInvoice.total_paid = invoiceData.totalPaid;
    if (invoiceData.balance !== undefined) dbInvoice.balance = invoiceData.balance;
    if (invoiceData.paymentStatus !== undefined) dbInvoice.payment_status = invoiceData.paymentStatus;
    if (invoiceData.invoiceUid !== undefined) dbInvoice.invoice_uid = invoiceData.invoiceUid;
    if (invoiceData.supabasePdfUrl !== undefined) dbInvoice.supabase_pdf_url = invoiceData.supabasePdfUrl;
    if (invoiceData.isProcessed !== undefined) dbInvoice.is_processed = invoiceData.isProcessed;

    const { error } = await supabase
      .from('gl_invoices')
      .update(dbInvoice)
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error updating invoice:', error);
      throw new Error(`Failed to update invoice: ${error.message}`);
    }

    return this.getInvoiceById(id);
  },

  /**
   * Delete an invoice
   */
  async deleteInvoice(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_invoices')
      .delete()
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error deleting invoice:', error);
      throw new Error(`Failed to delete invoice: ${error.message}`);
    }
  },

  /**
   * Subscribe to invoice changes
   */
  subscribeToInvoiceChanges(callback: (payload: any) => void) {
    return supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gl_invoices' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }
};
