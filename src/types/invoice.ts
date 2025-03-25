import { EntityBase, EntityStatus, EntityWithAccount, EntityWithAmount, EntityWithStatus } from './common';
import { GlAccount } from './accounts';

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
  createdAt: Date;
  updatedAt: Date;
  productDetails?: any;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  accountId: string;
  date: Date;
  amount: number;
  paymentMethod: string;
  notes?: string;
  paymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice extends EntityBase, EntityWithAmount, EntityWithAccount {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: Date;
  dueDate?: Date;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue';
  total_paid: number;
  balance: number;
  lineItems?: InvoiceLineItem[];
  payments?: InvoicePayment[];
  notes?: string;
  total?: number;
  createdAt?: Date;
  updatedAt?: Date;
  created_at: string;
  updated_at?: string;
  glide_row_id: string;
  total_amount: number;
}

export interface InvoiceWithDetails extends Invoice {
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
  account?: GlAccount;
  notes?: string;
  total?: number;
  amountPaid: number;
  subtotal: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InvoiceWithCustomer {
  id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue';
  amount: number;
  amountPaid: number;
  balance: number;
  createdAt: Date;
  updatedAt?: Date;
  customer?: GlAccount;
}

export interface InvoiceFilters {
  status?: string;
  customerId?: string;
  fromDate?: string | Date;
  toDate?: string | Date;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  search?: string;
}

export interface CreateInvoiceInput {
  customerId: string;
  invoiceDate: Date;
  dueDate?: Date;
  status: string;
  notes?: string;
  lineItems: Array<{
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface UpdateInvoiceInput {
  customerId?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  status?: string;
  notes?: string;
}

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
  amountPaid: number;
}
