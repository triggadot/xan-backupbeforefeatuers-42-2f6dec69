
export enum InvoiceStatus {
  DRAFT = 'draft',
  UNPAID = 'unpaid',
  PAID = 'paid',
  PARTIAL = 'partial',
  CREDIT = 'credit',
  OVERDUE = 'overdue'
}

export interface Invoice {
  id: string;
  glide_row_id: string;
  rowid_accounts: string | null;
  invoice_order_date: string | null;
  created_timestamp: string | null;
  submitted_timestamp: string | null;
  user_email: string | null;
  notes: string | null;
  doc_glideforeverlink: string | null;
  created_at: string | null;
  updated_at: string | null;
  total_amount: number | null;
  total_paid: number | null;
  balance: number | null;
  payment_status: string | null;
  invoice_uid?: string | null;
  due_date?: string | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
  supabase_pdf_url?: string | null;
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
  product_name_display?: string | null;
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
  account_email?: string | null;
  account_phone?: string | null;
  product_count?: number;
  account_type?: string;
}

export interface InvoiceWithAccount extends InvoiceWithLines {
  account?: Account;
  invoice_date?: string; // Used in FinancialSummary
  invoice_number?: string; // Used in FinancialSummary
  gl_accounts?: any; // Used in some components
}

// Add this mapping function to normalize invoice fields
export function normalizeInvoiceFields(invoice: Invoice): InvoiceWithAccount {
  if (!invoice) return {} as InvoiceWithAccount;

  return {
    ...invoice,
    // Map common field names to expected properties
    number: invoice.invoice_uid || `INV-${invoice.id.substring(0, 6)}`,
    date: invoice.invoice_order_date,
    invoice_date: invoice.invoice_order_date,
    invoice_number: invoice.invoice_uid || `INV-${invoice.id.substring(0, 6)}`,
    amount: invoice.total_amount,
    status: invoice.payment_status,
    lines: [], // Ensure lines exist as an empty array by default
  } as InvoiceWithAccount;
}
