
export interface PurchaseOrder {
  id: string;
  glide_row_id: string;
  purchase_order_uid?: string;
  number: string;
  rowid_accounts?: string;
  accountId?: string;
  accountName: string;
  po_date?: string;
  date: Date;
  payment_status: string;
  status: 'draft' | 'sent' | 'received' | 'partial' | 'complete';
  total_amount: number;
  total_paid: number;
  balance: number;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
  docs_shortlink?: string;
  vendor_uid?: string;
  lineItems: PurchaseOrderLineItem[];
  vendorPayments: VendorPayment[];
}

export interface PurchaseOrderLineItem {
  id: string;
  rowid_products: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  productDetails?: ProductDetails;
}

export interface ProductDetails {
  id: string;
  glide_row_id: string;
  name: string;
  display_name?: string;
  vendor_product_name?: string;
  new_product_name?: string;
  cost?: number;
  total_qty_purchased?: number;
  category?: string;
  product_image1?: string;
  purchase_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VendorPayment {
  id: string;
  date: Date | null;
  amount: number;
  method?: string;
  notes?: string;
}

export interface PurchaseOrderFilters {
  search?: string;
  status?: string;
  accountId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
