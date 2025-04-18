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
