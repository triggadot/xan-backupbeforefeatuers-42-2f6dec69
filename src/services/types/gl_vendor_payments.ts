import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_vendor_payments table
 */

// Database schema type matching Supabase gl_vendor_payments table
export interface GlVendorPaymentRecord {
  id: string;
  glide_row_id: string;
  rowid_accounts?: string;
  rowid_purchase_orders?: string;
  rowid_products?: string;
  payment_amount?: number;
  date_of_payment?: string;
  date_of_purchase_order?: string;
  vendor_note?: string;
  created_at: string;
  updated_at: string;
}

// Type for database insert/update operations
export interface GlVendorPaymentInsert {
  glide_row_id: string;
  rowid_accounts?: string;
  rowid_purchase_orders?: string;
  rowid_products?: string;
  payment_amount?: number;
  date_of_payment?: string;
  date_of_purchase_order?: string;
  vendor_note?: string;
}

// Frontend filter interface
export interface VendorPaymentFilters {
  accountId?: string;
  purchaseOrderId?: string;
  productId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Form data for creating/updating vendor payments
export interface VendorPaymentForm {
  accountId?: string;
  purchaseOrderId?: string;
  productId?: string;
  paymentAmount?: number;
  dateOfPayment?: Date;
  dateOfPurchaseOrder?: Date;
  vendorNote?: string;
}

// Vendor payment model for frontend use
export interface VendorPayment {
  id: string;
  glide_row_id: string;
  rowid_accounts?: string;
  rowid_purchase_orders?: string;
  rowid_products?: string;
  payment_amount?: number;
  date_of_payment?: string;
  date_of_purchase_order?: string;
  vendor_note?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Vendor Payments service for Supabase operations
 * Handles CRUD operations for gl_vendor_payments table
 */
export const glVendorPaymentsService = {
  /**
   * Get all vendor payments with optional filtering
   */
  async getVendorPayments(filters: VendorPaymentFilters = {}): Promise<VendorPayment[]> {
    let query = supabase
      .from('gl_vendor_payments')
      .select('*');

    // Apply filters
    if (filters.accountId) {
      query = query.eq('rowid_accounts', filters.accountId);
    }
    if (filters.purchaseOrderId) {
      query = query.eq('rowid_purchase_orders', filters.purchaseOrderId);
    }
    if (filters.productId) {
      query = query.eq('rowid_products', filters.productId);
    }
    if (filters.dateFrom) {
      query = query.gte('date_of_payment', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('date_of_payment', filters.dateTo.toISOString());
    }
    if (filters.search) {
      query = query.or(
        `vendor_note.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vendor payments:', error);
      throw new Error(`Failed to fetch vendor payments: ${error.message}`);
    }

    return (data as unknown as GlVendorPaymentRecord[]).map(item => {
      const payment: VendorPayment = {
        id: item.id,
        glide_row_id: item.glide_row_id,
        rowid_accounts: item.rowid_accounts,
        rowid_purchase_orders: item.rowid_purchase_orders,
        rowid_products: item.rowid_products,
        payment_amount: item.payment_amount,
        date_of_payment: item.date_of_payment,
        date_of_purchase_order: item.date_of_purchase_order,
        vendor_note: item.vendor_note,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
      return payment;
    });
  },

  /**
   * Get a single vendor payment by ID
   */
  async getVendorPaymentById(id: string): Promise<VendorPayment> {
    const { data, error } = await supabase
      .from('gl_vendor_payments')
      .select('*')
      .eq('glide_row_id', id)
      .single();

    if (error) {
      console.error('Error fetching vendor payment:', error);
      throw new Error(`Failed to fetch vendor payment: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Vendor payment with ID ${id} not found`);
    }

    const item = data as unknown as GlVendorPaymentRecord;
    const payment: VendorPayment = {
      id: item.id,
      glide_row_id: item.glide_row_id,
      rowid_accounts: item.rowid_accounts,
      rowid_purchase_orders: item.rowid_purchase_orders,
      rowid_products: item.rowid_products,
      payment_amount: item.payment_amount,
      date_of_payment: item.date_of_payment,
      date_of_purchase_order: item.date_of_purchase_order,
      vendor_note: item.vendor_note,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };

    return payment;
  },

  /**
   * Create a new vendor payment
   */
  async createVendorPayment(paymentData: VendorPaymentForm): Promise<VendorPayment> {
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const dbPayment: GlVendorPaymentInsert = {
      glide_row_id: uuid,
      rowid_accounts: paymentData.accountId,
      rowid_purchase_orders: paymentData.purchaseOrderId,
      rowid_products: paymentData.productId,
      payment_amount: paymentData.paymentAmount,
      date_of_payment: paymentData.dateOfPayment?.toISOString(),
      date_of_purchase_order: paymentData.dateOfPurchaseOrder?.toISOString(),
      vendor_note: paymentData.vendorNote,
    };

    const { data, error } = await supabase
      .from('gl_vendor_payments')
      .insert(dbPayment)
      .select()
      .single();

    if (error) {
      console.error('Error creating vendor payment:', error);
      throw new Error(`Failed to create vendor payment: ${error.message}`);
    }

    return this.getVendorPaymentById(data.glide_row_id);
  },

  /**
   * Update an existing vendor payment
   */
  async updateVendorPayment(id: string, paymentData: Partial<VendorPaymentForm>): Promise<VendorPayment> {
    const dbPayment: Partial<GlVendorPaymentInsert> = {};

    if (paymentData.accountId !== undefined) dbPayment.rowid_accounts = paymentData.accountId;
    if (paymentData.purchaseOrderId !== undefined) dbPayment.rowid_purchase_orders = paymentData.purchaseOrderId;
    if (paymentData.productId !== undefined) dbPayment.rowid_products = paymentData.productId;
    if (paymentData.paymentAmount !== undefined) dbPayment.payment_amount = paymentData.paymentAmount;
    if (paymentData.dateOfPayment !== undefined) dbPayment.date_of_payment = paymentData.dateOfPayment?.toISOString();
    if (paymentData.dateOfPurchaseOrder !== undefined) dbPayment.date_of_purchase_order = paymentData.dateOfPurchaseOrder?.toISOString();
    if (paymentData.vendorNote !== undefined) dbPayment.vendor_note = paymentData.vendorNote;

    const { error } = await supabase
      .from('gl_vendor_payments')
      .update(dbPayment)
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error updating vendor payment:', error);
      throw new Error(`Failed to update vendor payment: ${error.message}`);
    }

    return this.getVendorPaymentById(id);
  },

  /**
   * Delete a vendor payment
   */
  async deleteVendorPayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_vendor_payments')
      .delete()
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error deleting vendor payment:', error);
      throw new Error(`Failed to delete vendor payment: ${error.message}`);
    }
  },

  /**
   * Subscribe to vendor payment changes
   */
  subscribeToVendorPaymentChanges(callback: (payload: any) => void) {
    return supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gl_vendor_payments' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }
};
