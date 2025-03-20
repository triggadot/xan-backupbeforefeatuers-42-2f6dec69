import { GlAccount, GlCustomerPayment, GlInvoice, GlInvoiceLine, ProductDetails } from './index';

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  productDetails?: ProductDetails;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  accountId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceWithDetails {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: Date;
  dueDate?: Date;
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'partial';
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  amountPaid: number;
  balance: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
}

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: Date;
  dueDate?: Date;
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'partial';
  total: number;
  amountPaid: number;
  balance: number;
  lineItemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceFilters {
  search?: string;
  status?: string[];
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CreateInvoiceInput {
  customerId: string;
  invoiceDate: Date;
  dueDate?: Date;
  status?: 'draft' | 'sent';
  notes?: string;
  lineItems: {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateInvoiceInput {
  customerId?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  status?: 'draft' | 'sent' | 'overdue' | 'paid' | 'partial';
  notes?: string;
}

export interface AddLineItemInput {
  invoiceId: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdateLineItemInput {
  description?: string;
  quantity?: number;
  unitPrice?: number;
}

export interface AddPaymentInput {
  invoiceId: string;
  accountId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod?: string;
  notes?: string;
}

export const mapGlInvoiceToInvoiceListItem = (
  invoice: any
): InvoiceListItem => {
  return {
    id: invoice.id,
    invoiceNumber: invoice.glide_row_id || 'Unknown',
    customerId: invoice.rowid_accounts || '',
    customerName: invoice.customerName || 'Unknown Customer',
    invoiceDate: invoice.invoice_order_date ? new Date(invoice.invoice_order_date) : new Date(invoice.created_at),
    dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
    status: (invoice.processed ? 
      invoice.payment_status as any || 'sent' : 
      'draft'),
    total: Number(invoice.total_amount || 0),
    amountPaid: Number(invoice.totalPaid || 0),
    balance: Number(invoice.balance || 0),
    lineItemCount: Number(invoice.lineItemCount || 0),
    createdAt: new Date(invoice.created_at),
    updatedAt: new Date(invoice.updated_at),
  };
};

export const mapGlInvoiceLineToLineItem = (
  line: GlInvoiceLine & { productDetails?: ProductDetails }
): InvoiceLineItem => {
  return {
    id: line.id,
    invoiceId: line.rowid_invoices || '',
    productId: line.rowid_products || '',
    description: line.renamed_product_name || '',
    quantity: Number(line.qty_sold || 0),
    unitPrice: Number(line.selling_price || 0),
    total: Number(line.line_total || 0),
    createdAt: new Date(line.created_at),
    updatedAt: new Date(line.updated_at),
    productDetails: line.productDetails,
  };
};

export const mapGlCustomerPaymentToPayment = (
  payment: GlCustomerPayment
): InvoicePayment => {
  return {
    id: payment.id,
    invoiceId: payment.rowid_invoices || '',
    accountId: payment.rowid_accounts || '',
    amount: Number(payment.payment_amount || 0),
    paymentDate: payment.date_of_payment ? new Date(payment.date_of_payment) : new Date(payment.created_at),
    paymentMethod: payment.type_of_payment,
    notes: payment.payment_note,
    createdAt: new Date(payment.created_at),
    updatedAt: new Date(payment.updated_at),
  };
};
