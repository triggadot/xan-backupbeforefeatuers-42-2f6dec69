import { supabase } from '@/integrations/supabase/client';
import { InvoicePayment } from '@/types/invoice';

/**
 * Type definitions for gl_customer_payments table
 */

// Database schema type matching Supabase gl_customer_payments table
export interface GlInvoicePaymentRecord {
  id: string;
  glide_row_id: string;
  payment_amount?: number;
  date_of_payment?: string;
  type_of_payment?: string;
  payment_note?: string;
  rowid_invoices?: string;
  rowid_accounts?: string;
  email_of_user?: string;
  created_at: string;
  updated_at: string;
}

// Type for database insert/update operations
export interface GlInvoicePaymentInsert {
  glide_row_id: string;
  payment_amount?: number;
  date_of_payment?: string;
  type_of_payment?: string;
  payment_note?: string;
  rowid_invoices?: string;
  rowid_accounts?: string;
  email_of_user?: string;
}

// Frontend filter interface
export interface InvoicePaymentFilters {
  invoiceId?: string;
  accountId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Form data for creating/updating invoice payments
export interface InvoicePaymentFormData {
  paymentAmount?: number;
  dateOfPayment?: Date;
  paymentType?: string;
  paymentNote?: string;
  invoiceId?: string;
  accountId?: string;
  emailOfUser?: string;
}

/**
 * Maps a database record to the frontend InvoicePayment model
 */
const mapRecordToInvoicePayment = (record: GlInvoicePaymentRecord): InvoicePayment => {
  return {
    id: record.id,
    invoiceId: record.rowid_invoices || '',
    accountId: record.rowid_accounts || '',
    amount: Number(record.payment_amount || 0),
    paymentDate: new Date(record.date_of_payment || record.created_at),
    date: new Date(record.date_of_payment || record.created_at),
    paymentMethod: record.type_of_payment || '',
    notes: record.payment_note || '',
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  };
};

/**
 * Invoice Payments service for Supabase operations
 * Handles CRUD operations for gl_customer_payments table related to invoices
 */
export const glInvoicePaymentsService = {
  /**
   * Get all payments for a specific invoice
   */
  async getInvoicePayments(invoiceId?: string): Promise<InvoicePayment[]> {
    if (!invoiceId) return [];

    const { data, error } = await supabase
      .from('gl_customer_payments')
      .select('*')
      .eq('rowid_invoices', invoiceId)
      .order('date_of_payment', { ascending: false });

    if (error) {
      console.error('Error fetching invoice payments:', error);
      throw new Error(`Error fetching payments: ${error.message}`);
    }

    return (data || []).map(payment => mapRecordToInvoicePayment(payment as GlInvoicePaymentRecord));
  },

  /**
   * Get a single payment by ID
   */
  async getPaymentById(id: string): Promise<InvoicePayment> {
    const { data, error } = await supabase
      .from('gl_customer_payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching payment:', error);
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Payment with ID ${id} not found`);
    }

    return mapRecordToInvoicePayment(data as GlInvoicePaymentRecord);
  },

  /**
   * Update invoice payment status and total
   */
  async updateInvoiceTotal(invoiceGlideId: string): Promise<void> {
    if (!invoiceGlideId) return;
    
    try {
      // Get all payments for this invoice
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_customer_payments')
        .select('payment_amount')
        .eq('rowid_invoices', invoiceGlideId);
        
      if (paymentsError) throw paymentsError;
      
      // Calculate total paid amount
      const totalPaid = payments.reduce((sum, payment) => {
        return sum + Number(payment.payment_amount || 0);
      }, 0);
      
      // Get the invoice to determine the total amount
      const { data: invoice, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select('total_amount')
        .eq('glide_row_id', invoiceGlideId)
        .single();
        
      if (invoiceError) throw invoiceError;
      
      const totalAmount = Number(invoice.total_amount || 0);
      const balance = Math.max(0, totalAmount - totalPaid);
      
      // Determine the payment status
      let paymentStatus = 'UNPAID';
      if (totalPaid >= totalAmount) {
        paymentStatus = 'PAID';
      } else if (totalPaid > 0) {
        paymentStatus = 'PARTIAL';
      }
      
      // Update the invoice
      const { error: updateError } = await supabase
        .from('gl_invoices')
        .update({
          total_paid: totalPaid,
          balance: balance,
          payment_status: paymentStatus
        })
        .eq('glide_row_id', invoiceGlideId);
        
      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating invoice total:', error);
      throw new Error(`Failed to update invoice total: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Create a new invoice payment
   */
  async createPayment(invoiceGlideId: string, data: Partial<InvoicePayment>): Promise<InvoicePayment> {
    // Create a unique glide_row_id for the payment
    const paymentGlideId = `PAYMENT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Convert Date to ISO string if it's a Date object
    const paymentDate = data.paymentDate instanceof Date 
      ? data.paymentDate.toISOString() 
      : data.paymentDate;
    
    const paymentData: GlInvoicePaymentInsert = {
      glide_row_id: paymentGlideId,
      rowid_invoices: invoiceGlideId,
      rowid_accounts: data.accountId,
      payment_amount: data.amount,
      date_of_payment: paymentDate,
      type_of_payment: data.paymentMethod,
      payment_note: data.notes
    };
    
    const { data: newPayment, error } = await supabase
      .from('gl_customer_payments')
      .insert([paymentData])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating payment:', error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }
    
    // Update the invoice total
    await this.updateInvoiceTotal(invoiceGlideId);
    
    return mapRecordToInvoicePayment(newPayment as GlInvoicePaymentRecord);
  },

  /**
   * Update an existing invoice payment
   */
  async updatePayment(id: string, data: Partial<InvoicePayment>): Promise<InvoicePayment> {
    // Get the current payment to access the invoice ID
    const { data: currentPayment, error: fetchError } = await supabase
      .from('gl_customer_payments')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error('Error fetching payment for update:', fetchError);
      throw new Error(`Failed to fetch payment: ${fetchError.message}`);
    }
    
    // Prepare data for database update
    const paymentData: Partial<GlInvoicePaymentInsert> = {};
    
    if (data.accountId !== undefined) paymentData.rowid_accounts = data.accountId;
    if (data.amount !== undefined) paymentData.payment_amount = data.amount;
    if (data.paymentMethod !== undefined) paymentData.type_of_payment = data.paymentMethod;
    if (data.notes !== undefined) paymentData.payment_note = data.notes;
    
    // Convert Date to ISO string if it's a Date object
    if (data.paymentDate !== undefined) {
      paymentData.date_of_payment = data.paymentDate instanceof Date 
        ? data.paymentDate.toISOString() 
        : data.paymentDate;
    }
    
    // Update the payment
    const { data: updatedPayment, error: updateError } = await supabase
      .from('gl_customer_payments')
      .update(paymentData)
      .eq('id', id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating payment:', updateError);
      throw new Error(`Failed to update payment: ${updateError.message}`);
    }
    
    // Update the invoice total
    await this.updateInvoiceTotal(currentPayment.rowid_invoices);
    
    return mapRecordToInvoicePayment(updatedPayment as GlInvoicePaymentRecord);
  },

  /**
   * Delete an invoice payment
   */
  async deletePayment(id: string): Promise<void> {
    // Get the current payment to access the invoice ID
    const { data: payment, error: fetchError } = await supabase
      .from('gl_customer_payments')
      .select('rowid_invoices')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error('Error fetching payment for deletion:', fetchError);
      throw new Error(`Failed to fetch payment: ${fetchError.message}`);
    }
    
    // Delete the payment
    const { error: deleteError } = await supabase
      .from('gl_customer_payments')
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      console.error('Error deleting payment:', deleteError);
      throw new Error(`Failed to delete payment: ${deleteError.message}`);
    }
    
    // Update the invoice total
    await this.updateInvoiceTotal(payment.rowid_invoices);
  },

  /**
   * Subscribe to payment changes
   */
  subscribeToPaymentChanges(callback: (payload: any) => void) {
    // Subscribe to all changes for gl_customer_payments where rowid_invoices is not null
    const channel = supabase.channel('invoice-payments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gl_customer_payments',
          filter: 'rowid_invoices=is.not.null',
        },
        (payload: any) => {
          // Ensure callback is type-safe and robust
          callback(payload);
        }
      )
      .subscribe();
    // Return unsubscribe function for cleanup
    return () => {
      channel.unsubscribe();
    };
  }
};