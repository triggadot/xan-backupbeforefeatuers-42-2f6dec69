
// Type for the mv_estimate_customer_details materialized view
export interface EstimateFromView {
  estimate_id: string;
  glide_row_id: string;
  customer_id: string;
  customer_name: string;
  customer_glide_id: string;
  customer_uid?: string;
  estimate_date?: string;
  created_at: string;
  updated_at: string;
  status: string;
  total_amount: number;
  total_credits: number;
  balance: number;
  line_items_count: number;
  credit_count: number;
  is_a_sample?: boolean;
  rowid_invoices?: string;
  valid_final_create_invoice_clicked?: boolean;
}

// Type for estimate line items (from gl_estimate_lines table)
export interface EstimateLineFromDB {
  id: string;
  glide_row_id: string;
  rowid_estimate_lines: string;
  rowid_products?: string;
  sale_product_name?: string;
  qty_sold: number;
  selling_price: number;
  line_total: number;
  product_sale_note?: string;
  date_of_sale?: string;
  total_stock_after_sell?: number;
  created_at: string;
  updated_at: string;
}

// Type for customer credits (from gl_customer_credits table)
export interface CustomerCreditFromDB {
  id: string;
  glide_row_id: string;
  rowid_estimates: string;
  rowid_accounts?: string;
  rowid_invoices?: string;
  payment_amount: number;
  payment_note?: string;
  date_of_payment?: string;
  payment_type?: string;
  created_at: string;
  updated_at: string;
}

// Estimate line item for frontend use
export interface EstimateLine {
  id: string;
  glide_row_id: string;
  rowid_estimate_lines: string;
  sale_product_name?: string;
  qty_sold: number;
  selling_price: number;
  line_total: number;
  product_sale_note?: string;
  rowid_products?: string;
  productDetails?: ProductDetails;
}

// Customer credit for frontend use
export interface CustomerCredit {
  id: string;
  glide_row_id: string;
  payment_amount: number;
  payment_note?: string;
  date_of_payment?: string;
  payment_type?: string;
  rowid_accounts?: string;
  rowid_estimates: string;
}

// Simple estimate for list views
export interface EstimateListItem {
  id: string;
  glide_row_id: string;
  accountName: string;
  rowid_accounts: string;
  estimate_date?: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  balance: number;
  status: "draft" | "pending" | "converted";
  total_credits: number;
  is_a_sample?: boolean;
  rowid_invoices?: string;
}

// Full estimate details with related data
export interface EstimateWithDetails extends EstimateListItem {
  estimateLines: EstimateLine[];
  credits: CustomerCredit[];
}

// Re-export ProductDetails from invoiceView.ts for consistency
export interface ProductDetails {
  id: string;
  glide_row_id: string;
  name: string;
  vendor_product_name?: string;
  new_product_name?: string;
  cost?: number;
  category?: string;
  product_image1?: string;
}
