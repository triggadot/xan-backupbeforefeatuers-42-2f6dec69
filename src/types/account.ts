
export interface Account {
  id: string;
  glide_row_id: string;
  account_name: string;
  accounts_uid?: string;
  client_type?: string;
  email_of_who_added?: string;
  photo?: string;
  date_added_client?: string;
  created_at?: string;
  updated_at?: string;
  is_customer?: boolean;
  is_vendor?: boolean;
}

export interface AccountDetails extends Account {
  total_invoices?: number;
  total_invoice_amount?: number;
  total_paid?: number;
  balance?: number;
  last_invoice_date?: string;
  last_payment_date?: string;
}
