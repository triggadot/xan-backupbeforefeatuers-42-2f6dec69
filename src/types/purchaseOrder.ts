
export interface PurchaseOrder {
  id: string;
  number: string;
  vendorId: string;
  accountName: string;
  date: Date;
  dueDate?: Date | null;
  status: 'draft' | 'sent' | 'received' | 'partial' | 'complete';
  total: number;
  subtotal: number;
  tax: number;
  amountPaid: number;
  balance: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  lineItems: PurchaseOrderItem[];
  vendorPayments: VendorPayment[];
  
  // Add properties needed by Supabase mapping
  glide_row_id?: string;
  rowid_accounts?: string;
  po_date?: string;
  purchase_order_uid?: string;
}

export interface PurchaseOrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productDetails?: {
    id: string;
    name: string;
    display_name?: string;
    product_image1?: string;
    purchase_notes?: string;
  };
}

export interface VendorPayment {
  id: string;
  date: Date;
  amount: number;
  method?: string;
  notes?: string;
}
