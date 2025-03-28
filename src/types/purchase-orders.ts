
import { VendorPayment } from './vendorPayment';

export interface PurchaseOrder {
  id: string;
  glideRowId: string;
  status: string;
  poDate: string | null;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  vendorId: string;
  vendorName: string;
  lineItems: PurchaseOrderLineItem[];
  vendorPayments: VendorPayment[];
  purchaseOrderUid?: string;
  pdfLink?: string;
  // Additional properties needed by PurchaseOrderForm
  number?: string;
  date?: string | Date;
  dueDate?: string | Date;
  notes?: string;
}

export interface PurchaseOrderLineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface PurchaseOrderFilters {
  vendorId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PurchaseOrderWithVendor extends PurchaseOrder {
  vendorName: string;
}
