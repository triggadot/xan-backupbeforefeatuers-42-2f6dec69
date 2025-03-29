export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

export interface Invoice {
  id: string;
  glide_row_id: string;
  rowid_accounts: string | null;
  invoice_order_date: string | null;
  created_timestamp: string | null;
  submitted_timestamp: string | null;
  processed: boolean | null;
  user_email: string | null;
  notes: string | null;
  doc_glideforeverlink: string | null;
  created_at: string | null;
  updated_at: string | null;
  total_amount: number | null;
  total_paid: number | null;
  balance: number | null;
  payment_status: string | null;
  tax_rate: number | null;
  tax_amount: number | null;
  due_date: string | null;
}

export interface InvoiceLine {
  id: string;
  glide_row_id: string;
  renamed_product_name: string | null;
  display_name?: string; 
  date_of_sale: string | null;
  rowid_invoices: string | null;
  rowid_products: string | null;
  qty_sold: number | null;
  selling_price: number | null;
  product_sale_note: string | null;
  user_email_of_added: string | null;
  created_at: string | null;
  updated_at: string | null;
  line_total: number | null;
  product?: any; 
}

export interface InvoiceWithLines extends Invoice {
  lines: InvoiceLine[];
}

export interface Account {
  id: string;
  glide_row_id: string;
  account_name: string | null;
  email_of_who_added: string | null;
  client_type: string | null;
  accounts_uid: string | null;
  balance: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface InvoiceWithAccount extends InvoiceWithLines {
  account?: Account;
}
