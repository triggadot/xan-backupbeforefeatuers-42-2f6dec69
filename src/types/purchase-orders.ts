
import { Account } from './accounts';
import { BaseDocument, BaseDocumentRow, PaymentStatus } from './base';

export interface PurchaseOrderRow extends BaseDocumentRow {
  purchase_order_uid?: string;
  po_date?: string;
  payment_status?: PaymentStatus;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  product_count?: number;
  glide_pdf_url?: string;
  glide_pdf_url_secondary?: string;
  date_payment_date_mddyyyy?: string;
}

export interface PurchaseOrder extends BaseDocument {
  purchaseOrderUid: string;
  date: string;
  status: PaymentStatus;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  productCount: number;
  pdfUrl?: string;
  secondaryPdfUrl?: string;
  paymentDate?: string;
}

export interface PurchaseOrderWithAccount extends PurchaseOrder {
  account?: Account;
}

export interface PurchaseOrderFormData {
  accountId: string;
  date: string;
  status: PaymentStatus;
  notes?: string;
}

export interface PurchaseOrderFilters {
  status?: PaymentStatus | PaymentStatus[];
  startDate?: string;
  endDate?: string;
  vendorId?: string;
  search?: string;
}
