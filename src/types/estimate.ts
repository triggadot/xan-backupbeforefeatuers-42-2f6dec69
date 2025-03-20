
export interface Estimate {
  id: string;
  glide_row_id: string;
  rowid_accounts?: string;
  accountName?: string;
  rowid_invoices?: string;
  status: 'draft' | 'pending' | 'converted';
  total_amount: number;
  total_credits: number;
  balance: number;
  estimate_date?: string;
  valid_final_create_invoice_clicked?: boolean;
  is_a_sample?: boolean;
  glide_pdf_url?: string;
  created_at?: string;
  updated_at?: string;
}

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

export interface EstimateWithDetails extends Estimate {
  estimateLines: EstimateLine[];
  credits: CustomerCredit[];
}

export interface EstimateFilters {
  search?: string;
  status?: string[];
  accountId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
