import { GlAccount } from "../index";

export interface EstimateLine {
  id: string;
  glide_row_id: string;
  rowid_estimates?: string;
  rowid_products?: string;
  sale_product_name?: string;
  product_name_display?: string;
  qty_sold: number;
  selling_price: number;
  line_total: number;
  date_of_sale?: string; // Changed from string | Date to just string
  sale_note?: string; // Updated from product_sale_note to match DB schema
  total_stock_after_sell?: number;
  created_at: string; // Changed from string | Date to just string
  updated_at: string; // Changed from string | Date to just string
  productDetails?: any; // Add this to support the operations in the code
}

export interface CustomerCredit {
  id: string;
  glide_row_id: string;
  rowid_invoices?: string;
  rowid_estimates?: string;
  rowid_accounts?: string;
  payment_amount: number;
  payment_note?: string;
  payment_type?: string;
  date_of_payment?: string; // Changed from string | Date to just string
  created_at: string; // Changed from string | Date to just string
  updated_at: string; // Changed from string | Date to just string
}

export interface Estimate {
  id: string;
  glide_row_id: string;
  rowid_accounts?: string;
  rowid_invoices?: string;
  accountName?: string; // Used for display
  estimate_date?: string; // Changed from string | Date to just string
  is_a_sample?: boolean;
  is_note_added?: boolean; // Updated from add_note to match DB schema
  status: "pending" | "draft" | "converted";
  total_amount: number;
  total_credits: number;
  balance: number;
  glide_pdf_url?: string; // Internal Glide use only
  glide_pdf_url_secondary?: string; // Updated from glide_pdf_url2 to match DB schema
  supabase_pdf_url?: string; // Supabase storage URL for PDFs
  is_invoice_created?: boolean; // Updated from valid_final_create_invoice_clicked to match DB schema
  date_invoice_created?: string; // Updated from date_invoice_created_date to match DB schema
  created_at: string; // Changed from string | Date to just string
  updated_at: string; // Changed from string | Date to just string
  notes?: string; // Added from DB schema
  estimate_uid?: string; // Added from DB schema
}

export interface EstimateWithDetails extends Estimate {
  estimateLines?: EstimateLine[];
  credits?: CustomerCredit[];
  account?: GlAccount;
  pdf_link?: string; // Internal Glide use only
  supabase_pdf_url?: string; // Supabase storage URL for PDFs
}

// Add the EstimateFilters interface
export interface EstimateFilters {
  status?: "pending" | "draft" | "converted";
  accountId?: string;
  fromDate?: string;
  toDate?: string;
}

// Update PurchaseOrder interface to fix issues in PurchaseOrderDetail.tsx
export interface PurchaseOrder {
  id: string;
  glide_row_id: string;
  number?: string;
  date?: string;
  status: string;
  total_amount: number;
  total_paid: number;
  balance: number;
  vendorId?: string;
  vendorName?: string;
  notes?: string;
  lineItems: any[];
  vendorPayments: any[];
  products?: any[];
  payments?: any[];
  pdf_link?: string; // Internal Glide use only
  supabase_pdf_url?: string; // Supabase storage URL for PDFs
}
