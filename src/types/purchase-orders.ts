import { VendorPayment } from './vendorPayment';

export interface PurchaseOrder {
  id: string;
  glideRowId: string;
  status: string;
  poDate: string | null;
  date?: string | Date | null;
  dueDate?: string | Date | null;
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
  notes?: string;
  created_at: string;
  updated_at?: string;
  // Properties for product display
  products?: ProductItem[];
  product_count?: number;
}

export interface ProductItem {
  id: string;
  glide_row_id?: string;
  new_product_name?: string | null;
  vendor_product_name?: string | null;
  display_name?: string;
  total_qty_purchased?: number;
  cost?: number;
  purchase_notes?: string;
  samples?: boolean;
  fronted?: boolean;
  category?: string;
  product_image1?: string;
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
  number: string;
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
  total: number;
  poDate: string | null;
  totalAmount: number;
  lineItems: PurchaseOrderLineItem[];
  vendorPayments: VendorPayment[];
  created_at: string;
  updated_at?: string;
}
