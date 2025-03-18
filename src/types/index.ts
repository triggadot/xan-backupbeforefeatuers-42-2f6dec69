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

// Base document type for PurchaseOrders, Estimates, and Invoices
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

// Purchase Order type
export interface PurchaseOrder extends BaseDocument {
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  expectedDeliveryDate?: Date;
  amountPaid?: number;
  balance?: number;
  paymentStatus?: 'PAID' | 'PARTIAL' | 'UNPAID';
}

// Estimate type
export interface Estimate extends BaseDocument {
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  expiryDate?: Date;
  convertedToInvoiceId?: string;
}

// Invoice type
export interface Invoice extends BaseDocument {
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentTerms?: string;
  paymentDate?: Date;
  amountPaid: number;
  balance: number;
  estimateId?: string;
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
