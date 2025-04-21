
import { Account } from './accounts';
import { BaseDocument, BaseDocumentRow, PaymentStatus } from './base';

export interface InvoiceRow extends BaseDocumentRow {
  invoice_uid?: string;
  date_of_invoice?: string;
  payment_status?: PaymentStatus;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  glide_pdf_url?: string;
  user_email?: string;
}

export interface Invoice extends BaseDocument {
  invoiceUid: string;
  date: string;
  status: PaymentStatus;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  pdfUrl?: string;
  userEmail?: string;
}

export interface InvoiceWithAccount extends Invoice {
  account?: Account;
}

export interface InvoiceFormData {
  accountId: string;
  date: string;
  status: PaymentStatus;
  notes?: string;
}

export interface InvoicePaymentData {
  amount: number;
  date: string;
  paymentType?: string;
  notes?: string;
}
