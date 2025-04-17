import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_purchase_orders table
 */

// Database schema type matching Supabase gl_purchase_orders table
export interface GlPurchaseOrderRecord {
  id: string;
  glide_row_id: string;
  po_date?: string;
  rowid_accounts?: string;
  purchase_order_uid?: string;
  date_payment_date_mddyyyy?: string;
  glide_pdf_url_secondary?: string;
  created_at: string;
  updated_at: string;
  glide_pdf_url?: string;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  payment_status?: string;
  product_count?: number;
  supabase_pdf_url?: string;
  // Related data
  account?: {
    id: string;
    account_name: string;
    account_type: string;
  } | null;
}

// Type for database insert/update operations
export interface GlPurchaseOrderInsert {
  glide_row_id: string;
  po_date?: string;
  rowid_accounts?: string;
  purchase_order_uid?: string;
  date_payment_date_mddyyyy?: string;
  glide_pdf_url_secondary?: string;
  glide_pdf_url?: string;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  payment_status?: string;
  product_count?: number;
  supabase_pdf_url?: string;
}

// Frontend filter interface
export interface PurchaseOrderFilters {
  vendorId?: string;
  paymentStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Form data for creating/updating purchase orders
export interface PurchaseOrderForm {
  vendorId?: string;
  poDate?: Date;
  purchaseOrderUid?: string;
  paymentDate?: Date;
  glidePdfUrlSecondary?: string;
  glidePdfUrl?: string;
  supabasePdfUrl?: string;
  totalAmount?: number;
  totalPaid?: number;
  balance?: number;
  paymentStatus?: string;
  productCount?: number;
}

// Purchase order model for frontend use
export interface PurchaseOrder {
  id: string;
  glide_row_id: string;
  po_date?: string;
  vendorId?: string;
  vendorName?: string;
  purchase_order_uid?: string;
  payment_date?: string;
  glide_pdf_url_secondary?: string;
  created_at: string;
  updated_at: string;
  glide_pdf_url?: string;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  payment_status?: string;
  product_count?: number;
  supabase_pdf_url?: string;
  // Aliases for UI compatibility
  number?: string;
  date?: string | Date;
}

/**
 * Purchase Orders service for Supabase operations
 * Handles CRUD operations for gl_purchase_orders table
 */
export const glPurchaseOrdersService = {
  /**
   * Get all purchase orders with optional filtering
   */
  async getPurchaseOrders(filters: PurchaseOrderFilters = {}): Promise<PurchaseOrder[]> {
    let query = supabase
      .from('gl_purchase_orders')
      .select(`
        *,
        account:rowid_accounts(id, account_name, account_type)
      `);

    // Apply filters
    if (filters.vendorId) {
      query = query.eq('rowid_accounts', filters.vendorId);
    }
    if (filters.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus);
    }
    if (filters.dateFrom) {
      query = query.gte('po_date', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('po_date', filters.dateTo.toISOString());
    }
    if (filters.search) {
      query = query.or(
        `purchase_order_uid.ilike.%${filters.search}%,payment_status.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase orders:', error);
      throw new Error(`Failed to fetch purchase orders: ${error.message}`);
    }

    return (data as unknown as GlPurchaseOrderRecord[]).map(item => {
      const po: PurchaseOrder = {
        id: item.id,
        glide_row_id: item.glide_row_id,
        po_date: item.po_date,
        vendorId: item.rowid_accounts,
        vendorName: item.account?.account_name,
        purchase_order_uid: item.purchase_order_uid,
        payment_date: item.date_payment_date_mddyyyy,
        glide_pdf_url_secondary: item.glide_pdf_url_secondary,
        created_at: item.created_at,
        updated_at: item.updated_at,
        glide_pdf_url: item.glide_pdf_url,
        total_amount: item.total_amount,
        total_paid: item.total_paid,
        balance: item.balance,
        payment_status: item.payment_status,
        product_count: item.product_count,
        supabase_pdf_url: item.supabase_pdf_url,
        // Aliases for UI compatibility
        number: item.purchase_order_uid,
        date: item.po_date,
      };
      return po;
    });
  },

  /**
   * Get a single purchase order by ID
   */
  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    const { data, error } = await supabase
      .from('gl_purchase_orders')
      .select(`
        *,
        account:rowid_accounts(id, account_name, account_type)
      `)
      .eq('glide_row_id', id)
      .single();

    if (error) {
      console.error('Error fetching purchase order:', error);
      throw new Error(`Failed to fetch purchase order: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Purchase order with ID ${id} not found`);
    }

    const item = data as unknown as GlPurchaseOrderRecord;
    const po: PurchaseOrder = {
      id: item.id,
      glide_row_id: item.glide_row_id,
      po_date: item.po_date,
      vendorId: item.rowid_accounts,
      vendorName: item.account?.account_name,
      purchase_order_uid: item.purchase_order_uid,
      payment_date: item.date_payment_date_mddyyyy,
      glide_pdf_url_secondary: item.glide_pdf_url_secondary,
      created_at: item.created_at,
      updated_at: item.updated_at,
      glide_pdf_url: item.glide_pdf_url,
      total_amount: item.total_amount,
      total_paid: item.total_paid,
      balance: item.balance,
      payment_status: item.payment_status,
      product_count: item.product_count,
      supabase_pdf_url: item.supabase_pdf_url,
      // Aliases for UI compatibility
      number: item.purchase_order_uid,
      date: item.po_date,
    };

    return po;
  },

  /**
   * Create a new purchase order
   */
  async createPurchaseOrder(poData: PurchaseOrderForm): Promise<PurchaseOrder> {
    // Generate a UUID for the glide_row_id
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const dbPO: GlPurchaseOrderInsert = {
      glide_row_id: uuid,
      po_date: poData.poDate?.toISOString(),
      rowid_accounts: poData.vendorId,
      purchase_order_uid: poData.purchaseOrderUid,
      date_payment_date_mddyyyy: poData.paymentDate?.toISOString(),
      glide_pdf_url_secondary: poData.glidePdfUrlSecondary,
      glide_pdf_url: poData.glidePdfUrl,
      supabase_pdf_url: poData.supabasePdfUrl,
      total_amount: poData.totalAmount,
      total_paid: poData.totalPaid,
      balance: poData.balance,
      payment_status: poData.paymentStatus,
      product_count: poData.productCount,
    };

    const { data, error } = await supabase
      .from('gl_purchase_orders')
      .insert(dbPO)
      .select()
      .single();

    if (error) {
      console.error('Error creating purchase order:', error);
      throw new Error(`Failed to create purchase order: ${error.message}`);
    }

    return this.getPurchaseOrderById(data.glide_row_id);
  },

  /**
   * Update an existing purchase order
   */
  async updatePurchaseOrder(id: string, poData: Partial<PurchaseOrderForm>): Promise<PurchaseOrder> {
    const dbPO: Partial<GlPurchaseOrderInsert> = {};

    if (poData.poDate !== undefined) dbPO.po_date = poData.poDate.toISOString();
    if (poData.vendorId !== undefined) dbPO.rowid_accounts = poData.vendorId;
    if (poData.purchaseOrderUid !== undefined) dbPO.purchase_order_uid = poData.purchaseOrderUid;
    if (poData.paymentDate !== undefined) dbPO.date_payment_date_mddyyyy = poData.paymentDate.toISOString();
    if (poData.glidePdfUrlSecondary !== undefined) dbPO.glide_pdf_url_secondary = poData.glidePdfUrlSecondary;
    if (poData.glidePdfUrl !== undefined) dbPO.glide_pdf_url = poData.glidePdfUrl;
    if (poData.supabasePdfUrl !== undefined) dbPO.supabase_pdf_url = poData.supabasePdfUrl;
    if (poData.totalAmount !== undefined) dbPO.total_amount = poData.totalAmount;
    if (poData.totalPaid !== undefined) dbPO.total_paid = poData.totalPaid;
    if (poData.balance !== undefined) dbPO.balance = poData.balance;
    if (poData.paymentStatus !== undefined) dbPO.payment_status = poData.paymentStatus;
    if (poData.productCount !== undefined) dbPO.product_count = poData.productCount;

    const { error } = await supabase
      .from('gl_purchase_orders')
      .update(dbPO)
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error updating purchase order:', error);
      throw new Error(`Failed to update purchase order: ${error.message}`);
    }

    return this.getPurchaseOrderById(id);
  },

  /**
   * Delete a purchase order
   */
  async deletePurchaseOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_purchase_orders')
      .delete()
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error deleting purchase order:', error);
      throw new Error(`Failed to delete purchase order: ${error.message}`);
    }
  },

  /**
   * Subscribe to purchase order changes
   */
  subscribeToPurchaseOrderChanges(callback: (payload: any) => void) {
    return supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gl_purchase_orders' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }
};
