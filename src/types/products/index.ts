// Canonical product types are now defined in '@/types/product-types'.
// This file re-exports them for backward compatibility and migration.
import {
  GlProductRecord,
  GlProductInsert,
  GlProductUpdate,
  Product,
  ProductForm,
  ProductFilters,
  convertDbToProduct
} from '@/types/product-types';

// Deprecated: Remove after migration. Only use for legacy compatibility.
import { EntityBase, EntityStatus } from '../common';

// Canonical Product type is exported from '@/types/product-types'.
// Deprecated: Use Product from '@/types/product-types' instead.
/**
 * @deprecated Use Product from '@/types/product-types'
 */
export type Product = import('@/types/product-types').Product;
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
 * Extended product interface that includes all relationships
 */
export interface ProductDetail extends Product {
  // Related entities
  vendor?: Account;
  purchaseOrder?: PurchaseOrder;
  invoiceLines?: ProductInvoiceLine[];
  estimateLines?: ProductEstimateLine[];
  vendorPayments?: ProductVendorPayment[];
  supabase_pdf_url?: string | null;
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
  
  // Related entity
  invoice?: Invoice;
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
  
  // Related entity
  estimate?: Estimate;
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
  payment_amount: number;
  date_of_payment: Date;
  vendor_purchase_note?: string;
  
  // Derived fields for UI
  productId?: string; // Alias for rowid_products
  vendorId?: string; // Alias for rowid_accounts
  purchaseOrderId?: string; // Alias for rowid_purchase_orders
  paymentDate?: Date; // Alias for date_of_payment
  
  // Related entities
  account?: Account;
  purchaseOrder?: PurchaseOrder;
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

// Canonical ProductFilters type is exported from '@/types/product-types'.
// Deprecated: Use ProductFilters from '@/types/product-types' instead.
/**
 * @deprecated Use ProductFilters from '@/types/product-types'
 */
export type ProductFilters = import('@/types/product-types').ProductFilters;
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

// Canonical ProductForm type is exported from '@/types/product-types'.
// Deprecated: Use ProductForm from '@/types/product-types' instead.
/**
 * @deprecated Use ProductForm from '@/types/product-types'
 */
export type ProductFormData = import('@/types/product-types').ProductForm;
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
// Canonical GlProductRecord type is exported from '@/types/product-types'.
// Deprecated: Use GlProductRecord from '@/types/product-types' instead.
/**
 * @deprecated Use GlProductRecord from '@/types/product-types'
 */
export type GlProduct = import('@/types/product-types').GlProductRecord;
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
