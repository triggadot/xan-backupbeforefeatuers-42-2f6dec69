
import { GlAccount } from './index';

export interface EstimateLine {
  id: string;
  glide_row_id: string;
  rowid_estimate_lines?: string;
  rowid_products?: string;
  sale_product_name?: string;
  qty_sold: number;
  selling_price: number;
  line_total: number;
  date_of_sale?: string | Date;
  product_sale_note?: string;
  total_stock_after_sell?: number;
  created_at: string | Date;
  updated_at: string | Date;
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
  date_of_payment?: string | Date;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Estimate {
  id: string;
  glide_row_id: string;
  rowid_accounts?: string;
  rowid_invoices?: string;
  accountName?: string; // Used for display
  estimate_date?: string | Date;
  is_a_sample?: boolean;
  add_note?: boolean;
  status: 'pending' | 'draft' | 'converted';
  total_amount: number;
  total_credits: number;
  balance: number;
  glide_pdf_url?: string;
  glide_pdf_url2?: string;
  valid_final_create_invoice_clicked?: boolean;
  date_invoice_created_date?: string | Date;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface EstimateWithDetails extends Estimate {
  estimateLines?: EstimateLine[];
  credits?: CustomerCredit[];
}
