
import { EntityBase, EntityStatus, EntityWithAccount, EntityWithAmount, EntityWithStatus } from './common';
import { GlAccount } from './account';

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

export interface Invoice extends EntityBase, EntityWithStatus, EntityWithAmount, EntityWithAccount {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: Date;
  dueDate?: Date;
  total_paid: number;
  balance: number;
  lineItems?: InvoiceLineItem[];
  payments?: InvoicePayment[];
}

export interface InvoiceWithDetails extends Invoice {
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
  account?: GlAccount;
}

export interface InvoiceFilters {
  status?: EntityStatus;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
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
