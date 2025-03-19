
import { GlAccount, ProductDetails } from './index';

export interface EstimateLine {
  id: string;
  rowid_estimate_lines: string;
  sale_product_name: string;
  qty_sold: number;
  selling_price: number;
  line_total: number;
  product_sale_note?: string;
  date_of_sale?: string;
  rowid_products?: string;
  glide_row_id: string;
  created_at?: string;
  updated_at?: string;
  productDetails?: ProductDetails;
}

export interface CustomerCredit {
  id: string;
  rowid_estimates: string;
  rowid_accounts?: string;
  payment_amount: number;
  payment_note?: string;
  date_of_payment?: string;
  payment_type?: string;
  glide_row_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Estimate {
  id: string;
  glide_row_id: string;
  rowid_accounts?: string;
  rowid_invoices?: string;
  status: 'draft' | 'pending' | 'converted';
  total_amount: number;
  total_credits: number;
  balance: number;
  estimate_date?: string;
  valid_final_create_invoice_clicked?: boolean;
  add_note?: boolean;
  is_a_sample?: boolean;
  glide_pdf_url?: string;
  glide_pdf_url2?: string;
  date_invoice_created_date?: string;
  created_at?: string;
  updated_at?: string;
  accountName?: string;
  account?: GlAccount;
  estimateLines?: EstimateLine[];
  credits?: CustomerCredit[];
}
