import { EntityBase, EntityStatus, EntityWithAmount } from '../common/common';
import { GlAccount } from '../accounts';

export interface PurchaseOrder extends EntityBase, EntityWithAmount {
  id: string;
  glide_row_id: string;
  number?: string;
  date?: Date | string;
  status: string;
  vendorId?: string;
  vendorName?: string;
  vendor?: GlAccount;
  notes?: string;
  lineItems: PurchaseOrderLineItem[];
  vendorPayments: VendorPayment[];
  products?: any[];
  payments?: any[];
  // Additional fields for the detail view
  subtotal?: number;
  tax?: number;
  dueDate?: Date | string;
  amountPaid?: number;
  balance?: number;
  total?: number;
  total_paid?: number;
  rowid_accounts?: string;
  pdf_link?: string; // Internal Glide use only
  supabase_pdf_url?: string; // Supabase storage URL for PDFs
  created_at: string; // Required for database compatibility
  updated_at?: string; // Optional for future compatibility
  // New fields
  totalUnits?: number;
  totalCost?: number;
}

export interface PurchaseOrderLineItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  description?: string;
  productId?: string;
  productDetails?: any;
  product_name?: string;
  unit_price?: number;
  notes?: string; // Added notes field
  // Fields from gl_products
  vendor_product_name?: string;
  new_product_name?: string; // Added new_product_name field
  display_name?: string;
  samples?: boolean;
  fronted?: boolean;
  category?: string;
  total_units?: number;
}

export interface VendorPayment {
  id: string;
  amount: number;
  date?: Date | string;
  method?: string;
  notes?: string;
  vendorId?: string; // Add vendorId to fix type errors
}

export interface PurchaseOrderWithVendor extends PurchaseOrder {
  vendorName?: string;
  vendorId?: string;
  products?: any[];
  pdfLink?: string; // Legacy field - Internal Glide use only
  supabase_pdf_url?: string; // Supabase storage URL for PDFs
  number: string;
  date: Date | string;
  status: EntityStatus;
  total: number;
  balance: number;
  totalPaid: number;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderFilters {
  status?: string;
  vendorId?: string;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
}
