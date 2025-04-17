
// Type for the mv_purchase_order_vendor_details materialized view
export interface PurchaseOrderFromView {
  po_id: string;
  glide_row_id: string;
  purchase_order_uid?: string;
  vendor_id: string;
  vendor_name: string;
  vendor_glide_id: string;
  vendor_uid?: string;
  po_date?: string;
  created_at: string;
  updated_at: string;
  payment_status: string;
  total_amount: number;
  total_paid: number;
  balance: number;
  product_count: number;
  docs_shortlink?: string;
  pdf_link?: string;
  date_payment_date_mddyyyy?: string;
  notes?: string; // Added notes field
}

// Type for vendor payments (from gl_vendor_payments table)
export interface VendorPaymentFromDB {
  id: string;
  glide_row_id: string;
  rowid_purchase_orders: string;
  rowid_accounts?: string;
  rowid_products?: string;
  payment_amount: number;
  vendor_purchase_note?: string;
  date_of_payment?: string;
  date_of_purchase_order?: string;
  created_at: string;
  updated_at: string;
}

// Purchase Order for frontend use
export interface PurchaseOrder {
  id: string;
  glide_row_id: string;
  purchase_order_uid?: string;
  accountId: string;
  accountName: string;
  poDate?: string;
  status: string;
  total: number;
  totalPaid: number;
  balance: number;
  productCount: number;
  docsShortlink?: string;
  pdfLink?: string;
  created_at: string;
  updated_at: string;
  notes?: string; // Added notes field
}

// Product from gl_products table
export interface ProductFromDB {
  id: string;
  glide_row_id: string;
  vendor_product_name?: string;
  new_product_name?: string;
  display_name?: string;
  category?: string;
  cost?: number;
  total_qty_purchased?: number;
  rowid_purchase_orders?: string;
  rowid_accounts?: string;
  rowid_vendor_payments?: string;
  product_image1?: string;
  product_purchase_date?: string;
  purchase_notes?: string;
  created_at: string;
  updated_at: string;
}

// Purchase Order with Details
export interface PurchaseOrderWithDetails extends PurchaseOrder {
  products: ProductFromDB[];
  payments: VendorPaymentFromDB[];
}
