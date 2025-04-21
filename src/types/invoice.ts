
import { EntityBase } from './base';
import { Account } from './account';

export interface InvoiceRow extends EntityBase {
  invoice_uid?: string | null;
  rowid_accounts?: string | null;
  date_of_invoice?: string | null;
  payment_status?: string | null;
  total_amount?: number | null;
  total_paid?: number | null;
  balance?: number | null;
  notes?: string | null;
  supabase_pdf_url?: string | null;
  // Runtime data from joins
  account?: any;
  lines?: any[];
}

export interface InvoiceLine {
  id: string;
  glideRowId: string;
  productId: string;
  invoiceId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
}

export interface Invoice {
  id: string;
  glideRowId: string;
  invoiceUid: string;
  accountId: string;
  date: string;
  status: string;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  notes?: string;
  pdfUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Joined data
  account?: AccountSummary;
  lines?: InvoiceLine[];
}

export interface AccountSummary {
  id: string;
  name: string;
  type: string;
  glideRowId: string;
}

export interface InvoiceWithAccount extends Invoice {
  account?: AccountSummary;
}

export interface InvoiceFormData {
  accountId: string;
  date: string;
  status: string;
  notes?: string;
}

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  customer: string;
  date: string;
  status: string;
  total: number;
  balance: number;
};

export function normalizeInvoiceFields(invoice: InvoiceRow): InvoiceWithAccount {
  return {
    id: invoice.id,
    glideRowId: invoice.glide_row_id,
    invoiceUid: invoice.invoice_uid || '',
    accountId: invoice.rowid_accounts || '',
    date: invoice.date_of_invoice || '',
    status: invoice.payment_status || 'draft',
    totalAmount: invoice.total_amount || 0,
    totalPaid: invoice.total_paid || 0,
    balance: invoice.balance || 0,
    notes: invoice.notes || '',
    pdfUrl: invoice.supabase_pdf_url,
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at
  };
}
