import { EntityBase, EntityStatus } from '../common';

/**
 * Represents a product in the Glidebase system
 * Products are linked to purchase orders, invoices, and estimates
 */
export interface Product extends EntityBase {
  // Core Glidebase fields
  glide_row_id: string;
  rowid_accounts?: string;
  rowid_vendor_payments?: string;
  rowid_purchase_orders?: string;
  
  // Display fields
  vendor_product_name?: string;
  new_product_name?: string;
  display_name: string;
  category?: string;
  
  // Financial fields
  cost: number;
  total_qty_purchased: number;
  
  // Special product flags
  samples?: boolean;
  fronted?: boolean;
  miscellaneous_items?: boolean;
  terms_for_fronted_product?: string;
  total_units_behind_sample?: number;
  
  // Dates and metadata
  product_purchase_date?: Date | null;
  purchase_notes?: string;
  product_image1?: string;
  
  // Derived fields for UI
  name?: string; // Alias for display_name
  quantity?: number; // Alias for total_qty_purchased
  vendorId?: string; // Alias for rowid_accounts
  vendorName?: string;
  purchaseOrderId?: string; // Alias for rowid_purchase_orders
  purchaseDate?: Date | null; // Alias for product_purchase_date
  
  // Computed flags for UI
  isSample?: boolean; // Derived from samples
  isFronted?: boolean; // Derived from fronted
  isMiscellaneous?: boolean; // Derived from miscellaneous_items
  
  // Related items counts
  invoiceLineCount?: number;
  estimateLineCount?: number;
  purchaseOrderCount?: number;
  vendorPaymentCount?: number;
}

/**
 * Represents a line item in an invoice that references a product
 */
export interface ProductInvoiceLine {
  id: string;
  glide_row_id: string;
  rowid_products: string;
  rowid_invoices: string;
  quantity: number;
  unit_price: number;
  total: number;
  description?: string;
  notes?: string;
  
  // Derived fields for UI
  productId?: string; // Alias for rowid_products
  invoiceId?: string; // Alias for rowid_invoices
  unitPrice?: number; // Alias for unit_price
  productName?: string;
  invoiceUid?: string;
}

/**
 * Represents a line item in an estimate that references a product
 */
export interface ProductEstimateLine {
  id: string;
  glide_row_id: string;
  rowid_products: string;
  rowid_estimates: string;
  quantity: number;
  unit_price: number;
  total: number;
  description?: string;
  notes?: string;
  
  // Derived fields for UI
  productId?: string; // Alias for rowid_products
  estimateId?: string; // Alias for rowid_estimates
  unitPrice?: number; // Alias for unit_price
  productName?: string;
  estimateUid?: string;
}

/**
 * Represents a vendor payment associated with a product
 */
export interface ProductVendorPayment {
  id: string;
  glide_row_id: string;
  rowid_products: string;
  rowid_accounts: string;
  rowid_purchase_orders?: string;
  amount: number;
  payment_date: Date;
  notes?: string;
  
  // Derived fields for UI
  productId?: string; // Alias for rowid_products
  vendorId?: string; // Alias for rowid_accounts
  purchaseOrderId?: string; // Alias for rowid_purchase_orders
  paymentDate?: Date; // Alias for payment_date
}

/**
 * Represents a product that has not been fully paid for
 */
export interface UnpaidProduct {
  id: string;
  glide_row_id: string;
  name: string;
  quantity: number;
  unpaid_value: number;
  unpaid_type: string;
  date_created: string;
  created_at: string;
  customer_name: string;
  customer_id: string;
  product_image?: string;
  notes?: string;
  status: string;
  is_sample: boolean;
  is_fronted: boolean;
  payment_status: string;
  
  // Product details
  vendor_product_name?: string;
  new_product_name?: string;
  display_name?: string;
  vendor_name?: string;
  total_qty_purchased?: number;
  cost?: number;
  terms_for_fronted_product?: string;
}

/**
 * Filter options for product queries
 */
export interface ProductFilters {
  category?: string;
  vendorId?: string;
  purchaseOrderId?: string;
  status?: EntityStatus;
  search?: string;
  onlySamples?: boolean;
  onlyFronted?: boolean;
  onlyMiscellaneous?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Form data for creating or updating a product
 */
export interface ProductFormData {
  name: string;
  vendorId: string;
  category?: string;
  cost: number;
  quantity: number;
  purchaseDate?: Date | null;
  notes?: string;
  isSample?: boolean;
  isFronted?: boolean;
  isMiscellaneous?: boolean;
  frontedTerms?: string;
  sampleUnits?: number;
  purchaseOrderId?: string;
}

/**
 * Summary statistics for products
 */
export interface ProductSummary {
  totalProducts: number;
  totalValue: number;
  sampleCount: number;
  frontedCount: number;
  miscCount: number;
  byCategory: {
    category: string;
    count: number;
    value: number;
  }[];
  byVendor: {
    vendorId: string;
    vendorName: string;
    count: number;
    value: number;
  }[];
}

/**
 * Raw database record from gl_products table
 */
export interface GlProduct {
  id: string;
  glide_row_id?: string;
  rowid_accounts?: string;
  rowid_vendor_payments?: string;
  rowid_purchase_orders?: string;
  vendor_product_name?: string;
  new_product_name?: string;
  category?: string;
  cost?: number;
  total_qty_purchased?: number;
  samples?: boolean;
  fronted?: boolean;
  miscellaneous_items?: boolean;
  terms_for_fronted_product?: string;
  total_units_behind_sample?: number;
  product_purchase_date?: string;
  purchase_notes?: string;
  product_image1?: string;
  created_at?: string;
  updated_at?: string;
}
