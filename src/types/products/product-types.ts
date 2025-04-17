// Product Type Definitions
// --- Database Types (snake_case, Gl prefix) ---

/**
 * Database record for a product (matches Supabase table structure)
 */
export interface GlProductRecord {
  id: string;
  glide_row_id: string;
  rowid_accounts?: string | null;
  rowid_vendor_payments?: string | null;
  rowid_purchase_orders?: string | null;
  purchase_order_uid?: string | null;
  po_date?: string | null;
  vendor_product_name?: string | null;
  new_product_name?: string | null;
  date_of_purchase?: string | null;
  total_qty_purchased?: number | null;
  cost?: number | null;
  is_sample_or_fronted?: boolean | null;
  is_fronted?: boolean | null;
  terms_for_fronted_product?: string | null;
  is_sample?: boolean | null;
  total_units_behind_sample?: number | null;
  purchase_note?: string | null;
  is_miscellaneous?: boolean | null;
  category?: string | null;
  product_image1?: string | null;
  date_timestamp_subm?: string | null;
  email_email_of_user_who_added_product?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  display_name?: string | null;
  total_cost?: number | null;
  public_url_image?: string | null;
  public_url_video?: string | null;
  new_product_sku?: string | null;
  product_sku?: string | null;
  vendor_uid?: string | null;
}


/**
 * Insert type for product (required fields only, omits auto-generated)
 */
export interface GlProductInsert {
  // Required fields for insert (omit auto-generated fields like id)
  glide_row_id: string;
  display_name: string;
  // Add other required fields as needed
  // Optional fields (all others from GlProductRecord)
  [key: string]: any;
}


/**
 * Update type for product (all fields optional)
 */
export interface GlProductUpdate {
  // All fields optional
  [key: string]: any;
}


// --- Frontend Types (camelCase, no prefix) ---

/**
 * UnpaidProduct: Used for unpaid inventory dashboard and related features
 */
export interface UnpaidProduct {
  productId: string;
  glideRowId: string;
  productName: string;
  unpaidType: 'Sample' | 'Fronted';
  quantity: number;
  value: number;
  dateAdded?: string;
  userEmailOfAdded?: string;
  // Add any other fields used in UnpaidInventory or dashboard
  [key: string]: any;
}


/**
 * Product model for UI/business logic (can add derived fields)
 */
export interface Product {
  id: string;
  glideRowId: string;
  vendorId?: string | null;
  purchaseOrderId?: string | null;
  name: string;
  cost?: number | null;
  quantity?: number | null;
  isSample?: boolean | null;
  isFronted?: boolean | null;
  isMiscellaneous?: boolean | null;
  category?: string | null;
  imageUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  notes?: string | null;
  // Derived fields
  totalCost?: number | null;
  vendorName?: string | null;
  purchaseOrderUid?: string | null;
  sku?: string | null;
  // Add more as needed
}


/**
 * Product form data (for forms/UI input)
 */
export interface ProductForm {
  name: string;
  vendorId?: string | null;
  purchaseOrderId?: string | null;
  cost?: number | null;
  quantity?: number | null;
  isSample?: boolean | null;
  isFronted?: boolean | null;
  isMiscellaneous?: boolean | null;
  category?: string | null;
  imageUrl?: string | null;
  notes?: string | null;
  sku?: string | null;
  // Add more as needed
}


/**
 * Product filters (for search/filter UI)
 */
export interface ProductFilters {
  name?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

/**
 * Converts a GlProductRecord to a Product (frontend model)
 */
export function convertDbToProduct(record: GlProductRecord): Product {
  return {
    id: record.id,
    glideRowId: record.glide_row_id,
    vendorId: record.rowid_accounts ?? undefined,
    purchaseOrderId: record.rowid_purchase_orders ?? undefined,
    name: record.display_name || record.vendor_product_name || record.new_product_name || '',
    cost: record.cost ?? undefined,
    quantity: record.total_qty_purchased ?? undefined,
    isSample: record.is_sample ?? undefined,
    isFronted: record.is_fronted ?? undefined,
    isMiscellaneous: record.is_miscellaneous ?? undefined,
    category: record.category ?? undefined,
    imageUrl: record.public_url_image ?? record.product_image1 ?? undefined,
    createdAt: record.created_at ?? undefined,
    updatedAt: record.updated_at ?? undefined,
    notes: record.purchase_note ?? undefined,
    totalCost: record.total_cost ?? undefined,
    vendorName: record.vendor_product_name ?? undefined,
    purchaseOrderUid: record.purchase_order_uid ?? undefined,
    sku: record.product_sku ?? record.new_product_sku ?? undefined,
    imageUrl: record.image_url,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    inStock: record.quantity > 0,
  };
}
