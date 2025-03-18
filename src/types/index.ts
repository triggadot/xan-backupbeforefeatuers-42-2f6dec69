// Base entity type with common fields
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Account type - for customers and vendors
export interface Account extends BaseEntity {
  name: string;
  type: 'customer' | 'vendor' | 'both';
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  status: 'active' | 'inactive';
  balance: number;
}

// Database representation of gl_accounts
export interface GlAccount {
  id: string;
  account_name: string;
  client_type: string;
  email_of_who_added: string;
  accounts_uid?: string;
  photo?: string;
  date_added_client?: string;
  created_at: string;
  updated_at: string;
  glide_row_id: string;
}

// Product type
export interface Product extends BaseEntity {
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost: number;
  quantity: number;
  category?: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
}

// Line item for orders, estimates, and invoices
export interface LineItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Database representation of gl_invoice_lines
export interface GlInvoiceLine {
  id: string;
  rowid_invoices: string;
  rowid_products: string;
  renamed_product_name: string;
  qty_sold: number;
  selling_price: number;
  line_total: number;
  product_sale_note?: string;
  date_of_sale?: string;
  user_email_of_added?: string;
  created_at: string;
  updated_at: string;
  glide_row_id: string;
}

// Database representation of gl_customer_payments
export interface GlCustomerPayment {
  id: string;
  rowid_invoices: string;
  rowid_accounts: string;
  payment_amount: number;
  payment_note?: string;
  date_of_payment?: string;
  type_of_payment?: string;
  email_of_user?: string;
  created_at: string;
  updated_at: string;
  glide_row_id: string;
}

// Database representation of gl_invoices
export interface GlInvoice {
  id: string;
  rowid_accounts: string;
  glide_row_id: string;
  created_timestamp?: string;
  submitted_timestamp?: string;
  invoice_order_date?: string;
  processed?: boolean;
  notes?: string;
  doc_glideforeverlink?: string;
  user_email?: string;
  created_at: string;
  updated_at: string;
}

// Base document type for invoices and purchase orders
export interface BaseDocument extends BaseEntity {
  number: string;
  date: Date;
  dueDate?: Date;
  accountId: string;
  accountName: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  lineItems: LineItem[];
}

// Purchase order type
export interface PurchaseOrder extends BaseDocument {
  status: 'draft' | 'sent' | 'received' | 'partial' | 'complete';
  balance: number;
  amountPaid: number;
  vendorId: string;
}

// Database representation of gl_purchase_orders
export interface GlPurchaseOrder {
  id: string;
  rowid_accounts: string;
  purchase_order_uid?: string;
  po_date?: string;
  pdf_link?: string;
  date_payment_date_mddyyyy?: string;
  docs_shortlink?: string;
  created_at: string;
  updated_at: string;
  glide_row_id: string;
}

// Database representation of gl_vendor_payments
export interface GlVendorPayment {
  id: string;
  rowid_purchase_orders: string;
  rowid_accounts: string;
  rowid_products?: string;
  payment_amount: number;
  vendor_purchase_note?: string;
  date_of_payment?: string;
  date_of_purchase_order?: string;
  created_at: string;
  updated_at: string;
  glide_row_id: string;
}

// Invoice type
export interface Invoice extends BaseDocument {
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'partial';
  balance: number;
  amountPaid: number;
  payments: Payment[];
}

// Payment type
export interface Payment {
  id: string;
  date: Date;
  amount: number;
  method?: string;
  notes?: string;
}

// Dashboard analytics/metrics types
export interface Metric {
  label: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

// Filter types
export interface Filter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: string | number | boolean | Date;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Table column definition
export interface ColumnDef {
  id: string;
  header: string;
  accessorKey?: string;
  cell?: (info: any) => React.ReactNode;
  enableSorting?: boolean;
  sortingFn?: string;
}
