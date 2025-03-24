// Type for the mv_invoice_customer_details materialized view
export interface InvoiceFromView {
  invoice_id: string;
  glide_row_id: string;
  customer_id: string;
  customer_name: string;
  customer_glide_id: string;
  customer_uid?: string;
  invoice_order_date?: string;
  created_at: string;
  updated_at: string;
  payment_status: string;
  total_amount: number;
  total_paid: number;
  balance: number;
  line_items_count: number;
  processed?: boolean;
  notes?: string;
  doc_glideforeverlink?: string;
  submitted_timestamp?: string;
  user_email?: string;
}

// Type for invoice line items (from gl_invoice_lines table)
export interface InvoiceLineFromDB {
  id: string;
  glide_row_id: string;
  rowid_invoices: string;
  rowid_products?: string;
  renamed_product_name?: string;
  qty_sold: number;
  selling_price: number;
  line_total: number;
  product_sale_note?: string;
  date_of_sale?: string;
  user_email_of_added?: string;
  created_at: string;
  updated_at: string;
}

// Type for customer payments (from gl_customer_payments table)
export interface CustomerPaymentFromDB {
  id: string;
  glide_row_id: string;
  rowid_invoices: string;
  rowid_accounts?: string;
  payment_amount: number;
  payment_note?: string;
  date_of_payment?: string;
  type_of_payment?: string;
  email_of_user?: string;
  created_at: string;
  updated_at: string;
}

// Mapped invoice for frontend use
export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  glideRowId: string;
  customerId: string;
  customerName: string;
  date: Date;
  dueDate?: Date;
  total: number;
  balance: number;
  status: string;
  lineItemsCount: number;
  notes?: string;
}

// Product details for line items
export interface ProductDetails {
  id: string;
  glide_row_id: string;
  name: string;
  display_name?: string;
  vendor_product_name?: string;
  new_product_name?: string;
  cost?: number;
  category?: string;
  product_image1?: string;
}

// Invoice line item for frontend use
export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  productId: string;
  description: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  productDetails?: ProductDetails | null;
}

// Invoice payment for frontend use
export interface InvoicePayment {
  id: string;
  invoiceId: string;
  accountId: string;
  date: Date;
  amount: number;
  paymentMethod?: string;
  notes?: string;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
}

// Full invoice details with related data
export interface InvoiceWithDetails {
  id: string;
  invoiceNumber: string;
  glideRowId: string;
  customerId: string;
  customerName: string;
  date: Date;
  dueDate?: Date;
  invoiceDate: Date;
  subtotal: number;
  total: number;
  totalPaid: number;
  balance: number;
  amountPaid: number;
  status: "draft" | "paid" | "partial" | "sent" | "overdue";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
}
