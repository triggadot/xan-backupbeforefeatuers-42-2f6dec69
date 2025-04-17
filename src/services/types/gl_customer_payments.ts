import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_customer_payments table
 */

// Database schema type matching Supabase gl_customer_payments table
export interface GlCustomerPaymentRecord {
  id: string;
  glide_row_id: string;
  payment_amount?: number;
  date_of_payment?: string;
  payment_type?: string;
  payment_note?: string;
  rowid_invoices?: string;
  rowid_accounts?: string;
  email_of_user?: string;
  created_at: string;
  updated_at: string;
}

// Type for database insert/update operations
export interface GlCustomerPaymentInsert {
  glide_row_id: string;
  payment_amount?: number;
  date_of_payment?: string;
  payment_type?: string;
  payment_note?: string;
  rowid_invoices?: string;
  rowid_accounts?: string;
  email_of_user?: string;
}

// Frontend filter interface
export interface CustomerPaymentFilters {
  invoiceId?: string;
  accountId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Form data for creating/updating customer payments
export interface CustomerPaymentForm {
  paymentAmount?: number;
  dateOfPayment?: Date;
  paymentType?: string;
  paymentNote?: string;
  invoiceId?: string;
  accountId?: string;
  emailOfUser?: string;
}

// Customer payment model for frontend use
export interface CustomerPayment {
  id: string;
  glide_row_id: string;
  payment_amount?: number;
  date_of_payment?: string;
  payment_type?: string;
  payment_note?: string;
  rowid_invoices?: string;
  rowid_accounts?: string;
  email_of_user?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Customer Payments service for Supabase operations
 * Handles CRUD operations for gl_customer_payments table
 */
export const glCustomerPaymentsService = {
  /**
   * Get all customer payments with optional filtering
   */
  async getCustomerPayments(filters: CustomerPaymentFilters = {}): Promise<CustomerPayment[]> {
    let query = supabase
      .from('gl_customer_payments')
      .select('*');

    // Apply filters
    if (filters.invoiceId) {
      query = query.eq('rowid_invoices', filters.invoiceId);
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
        `payment_type.ilike.%${filters.search}%,payment_note.ilike.%${filters.search}%,email_of_user.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer payments:', error);
      throw new Error(`Failed to fetch customer payments: ${error.message}`);
    }

    return (data as unknown as GlCustomerPaymentRecord[]).map(item => {
      const payment: CustomerPayment = {
        id: item.id,
        glide_row_id: item.glide_row_id,
        payment_amount: item.payment_amount,
        date_of_payment: item.date_of_payment,
        payment_type: item.payment_type,
        payment_note: item.payment_note,
        rowid_invoices: item.rowid_invoices,
        rowid_accounts: item.rowid_accounts,
        email_of_user: item.email_of_user,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
      return payment;
    });
  },

  /**
   * Get a single customer payment by ID
   */
  async getCustomerPaymentById(id: string): Promise<CustomerPayment> {
    const { data, error } = await supabase
      .from('gl_customer_payments')
      .select('*')
      .eq('glide_row_id', id)
      .single();

    if (error) {
      console.error('Error fetching customer payment:', error);
      throw new Error(`Failed to fetch customer payment: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Customer payment with ID ${id} not found`);
    }

    const item = data as unknown as GlCustomerPaymentRecord;
    const payment: CustomerPayment = {
      id: item.id,
      glide_row_id: item.glide_row_id,
      payment_amount: item.payment_amount,
      date_of_payment: item.date_of_payment,
      payment_type: item.payment_type,
      payment_note: item.payment_note,
      rowid_invoices: item.rowid_invoices,
      rowid_accounts: item.rowid_accounts,
      email_of_user: item.email_of_user,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };

    return payment;
  },

  /**
   * Create a new customer payment
   */
  async createCustomerPayment(paymentData: CustomerPaymentForm): Promise<CustomerPayment> {
    // Generate a UUID for the glide_row_id
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const dbPayment: GlCustomerPaymentInsert = {
      glide_row_id: uuid,
      payment_amount: paymentData.paymentAmount,
      date_of_payment: paymentData.dateOfPayment?.toISOString(),
      payment_type: paymentData.paymentType,
      payment_note: paymentData.paymentNote,
      rowid_invoices: paymentData.invoiceId,
      rowid_accounts: paymentData.accountId,
      email_of_user: paymentData.emailOfUser,
    };

    const { data, error } = await supabase
      .from('gl_customer_payments')
      .insert(dbPayment)
      .select()
      .single();

    if (error) {
      console.error('Error creating customer payment:', error);
      throw new Error(`Failed to create customer payment: ${error.message}`);
    }

    return this.getCustomerPaymentById(data.glide_row_id);
  },

  /**
   * Update an existing customer payment
   */
  async updateCustomerPayment(id: string, paymentData: Partial<CustomerPaymentForm>): Promise<CustomerPayment> {
    const dbPayment: Partial<GlCustomerPaymentInsert> = {};

    if (paymentData.paymentAmount !== undefined) dbPayment.payment_amount = paymentData.paymentAmount;
    if (paymentData.dateOfPayment !== undefined) dbPayment.date_of_payment = paymentData.dateOfPayment?.toISOString();
    if (paymentData.paymentType !== undefined) dbPayment.payment_type = paymentData.paymentType;
    if (paymentData.paymentNote !== undefined) dbPayment.payment_note = paymentData.paymentNote;
    if (paymentData.invoiceId !== undefined) dbPayment.rowid_invoices = paymentData.invoiceId;
    if (paymentData.accountId !== undefined) dbPayment.rowid_accounts = paymentData.accountId;
    if (paymentData.emailOfUser !== undefined) dbPayment.email_of_user = paymentData.emailOfUser;

    const { error } = await supabase
      .from('gl_customer_payments')
      .update(dbPayment)
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error updating customer payment:', error);
      throw new Error(`Failed to update customer payment: ${error.message}`);
    }

    return this.getCustomerPaymentById(id);
  },

  /**
   * Delete a customer payment
   */
  async deleteCustomerPayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_customer_payments')
      .delete()
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error deleting customer payment:', error);
      throw new Error(`Failed to delete customer payment: ${error.message}`);
    }
  },

  /**
   * Subscribe to customer payment changes
   */
  subscribeToCustomerPaymentChanges(callback: (payload: any) => void) {
    return supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gl_customer_payments' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }
};
