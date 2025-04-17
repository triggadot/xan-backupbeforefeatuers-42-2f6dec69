import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_customer_credits table
 */

// Database schema type matching Supabase gl_customer_credits table
export interface GlCustomerCreditRecord {
  id: string;
  glide_row_id: string;
  date_of_payment?: string;
  payment_type?: string;
  rowid_invoices?: string;
  rowid_estimates?: string;
  rowid_accounts?: string;
  payment_amount?: number;
  payment_note?: string;
  created_at: string;
  updated_at: string;
}

// Type for database insert/update operations
export interface GlCustomerCreditInsert {
  glide_row_id: string;
  date_of_payment?: string;
  payment_type?: string;
  rowid_invoices?: string;
  rowid_estimates?: string;
  rowid_accounts?: string;
  payment_amount?: number;
  payment_note?: string;
}

// Frontend filter interface
export interface CustomerCreditFilters {
  invoiceId?: string;
  estimateId?: string;
  accountId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Form data for creating/updating customer credits
export interface CustomerCreditForm {
  dateOfPayment?: Date;
  paymentType?: string;
  invoiceId?: string;
  estimateId?: string;
  accountId?: string;
  paymentAmount?: number;
  paymentNote?: string;
}

// Customer credit model for frontend use
export interface CustomerCredit {
  id: string;
  glide_row_id: string;
  date_of_payment?: string;
  payment_type?: string;
  rowid_invoices?: string;
  rowid_estimates?: string;
  rowid_accounts?: string;
  payment_amount?: number;
  payment_note?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Customer Credits service for Supabase operations
 * Handles CRUD operations for gl_customer_credits table
 */
export const glCustomerCreditsService = {
  /**
   * Get all customer credits with optional filtering
   */
  async getCustomerCredits(filters: CustomerCreditFilters = {}): Promise<CustomerCredit[]> {
    let query = supabase
      .from('gl_customer_credits')
      .select('*');

    // Apply filters
    if (filters.invoiceId) {
      query = query.eq('rowid_invoices', filters.invoiceId);
    }
    if (filters.estimateId) {
      query = query.eq('rowid_estimates', filters.estimateId);
    }
    if (filters.accountId) {
      query = query.eq('rowid_accounts', filters.accountId);
    }
    if (filters.dateFrom) {
      query = query.gte('date_of_payment', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('date_of_payment', filters.dateTo.toISOString());
    }
    if (filters.search) {
      query = query.or(
        `payment_type.ilike.%${filters.search}%,payment_note.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer credits:', error);
      throw new Error(`Failed to fetch customer credits: ${error.message}`);
    }

    return (data as unknown as GlCustomerCreditRecord[]).map(item => {
      const credit: CustomerCredit = {
        id: item.id,
        glide_row_id: item.glide_row_id,
        date_of_payment: item.date_of_payment,
        payment_type: item.payment_type,
        rowid_invoices: item.rowid_invoices,
        rowid_estimates: item.rowid_estimates,
        rowid_accounts: item.rowid_accounts,
        payment_amount: item.payment_amount,
        payment_note: item.payment_note,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
      return credit;
    });
  },

  /**
   * Get a single customer credit by ID
   */
  async getCustomerCreditById(id: string): Promise<CustomerCredit> {
    const { data, error } = await supabase
      .from('gl_customer_credits')
      .select('*')
      .eq('glide_row_id', id)
      .single();

    if (error) {
      console.error('Error fetching customer credit:', error);
      throw new Error(`Failed to fetch customer credit: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Customer credit with ID ${id} not found`);
    }

    const item = data as unknown as GlCustomerCreditRecord;
    const credit: CustomerCredit = {
      id: item.id,
      glide_row_id: item.glide_row_id,
      date_of_payment: item.date_of_payment,
      payment_type: item.payment_type,
      rowid_invoices: item.rowid_invoices,
      rowid_estimates: item.rowid_estimates,
      rowid_accounts: item.rowid_accounts,
      payment_amount: item.payment_amount,
      payment_note: item.payment_note,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };

    return credit;
  },

  /**
   * Create a new customer credit
   */
  async createCustomerCredit(creditData: CustomerCreditForm): Promise<CustomerCredit> {
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const dbCredit: GlCustomerCreditInsert = {
      glide_row_id: uuid,
      date_of_payment: creditData.dateOfPayment?.toISOString(),
      payment_type: creditData.paymentType,
      rowid_invoices: creditData.invoiceId,
      rowid_estimates: creditData.estimateId,
      rowid_accounts: creditData.accountId,
      payment_amount: creditData.paymentAmount,
      payment_note: creditData.paymentNote,
    };

    const { data, error } = await supabase
      .from('gl_customer_credits')
      .insert(dbCredit)
      .select()
      .single();

    if (error) {
      console.error('Error creating customer credit:', error);
      throw new Error(`Failed to create customer credit: ${error.message}`);
    }

    return this.getCustomerCreditById(data.glide_row_id);
  },

  /**
   * Update an existing customer credit
   */
  async updateCustomerCredit(id: string, creditData: Partial<CustomerCreditForm>): Promise<CustomerCredit> {
    const dbCredit: Partial<GlCustomerCreditInsert> = {};

    if (creditData.dateOfPayment !== undefined) dbCredit.date_of_payment = creditData.dateOfPayment?.toISOString();
    if (creditData.paymentType !== undefined) dbCredit.payment_type = creditData.paymentType;
    if (creditData.invoiceId !== undefined) dbCredit.rowid_invoices = creditData.invoiceId;
    if (creditData.estimateId !== undefined) dbCredit.rowid_estimates = creditData.estimateId;
    if (creditData.accountId !== undefined) dbCredit.rowid_accounts = creditData.accountId;
    if (creditData.paymentAmount !== undefined) dbCredit.payment_amount = creditData.paymentAmount;
    if (creditData.paymentNote !== undefined) dbCredit.payment_note = creditData.paymentNote;

    const { error } = await supabase
      .from('gl_customer_credits')
      .update(dbCredit)
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error updating customer credit:', error);
      throw new Error(`Failed to update customer credit: ${error.message}`);
    }

    return this.getCustomerCreditById(id);
  },

  /**
   * Delete a customer credit
   */
  async deleteCustomerCredit(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_customer_credits')
      .delete()
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error deleting customer credit:', error);
      throw new Error(`Failed to delete customer credit: ${error.message}`);
    }
  },

  /**
   * Subscribe to customer credit changes
   */
  subscribeToCustomerCreditChanges(callback: (payload: any) => void) {
    return supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gl_customer_credits' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }
};
