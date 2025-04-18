
/**
 * Types for the gl_invoices table in the database
 * This file establishes the core database types with proper naming conventions
 */

// Database Record Types (snake_case, matching exact database schema)
export interface GlInvoiceRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
  glide_row_id?: string;
  invoice_uid: string;
  invoice_date: string;
  due_date: string;
  customer_id: string;
  invoice_status: string;
  payment_status: string;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  balance_amount: number;
  notes?: string;
  terms?: string;
  is_paid: boolean;
  payment_date?: string;
  supabase_pdf_url?: string;
  last_pdf_generated_at?: string;
  invoice_number?: string;
}

// Database Insert Type (for INSERT operations)
export interface GlInvoiceInsert extends Omit<GlInvoiceRecord, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

// Database Update Type (for UPDATE operations, all fields optional)
export interface GlInvoiceUpdate extends Partial<GlInvoiceInsert> {
  updated_at?: string; // Sometimes we want to explicitly set this
}

// Frontend Model Types (camelCase, for UI components)
export interface Invoice {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  glideRowId?: string;
  invoiceUid: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  invoiceStatus: string;
  paymentStatus: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  balanceAmount: number;
  notes?: string;
  terms?: string;
  isPaid: boolean;
  paymentDate?: string;
  supabasePdfUrl?: string;
  lastPdfGeneratedAt?: string;
  invoiceNumber?: string;
}

// Frontend Form Type (for form inputs and data collection)
export interface InvoiceForm {
  invoiceUid: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  invoiceStatus: string;
  paymentStatus: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  balanceAmount: number;
  notes?: string;
  terms?: string;
  isPaid: boolean;
}

// Frontend Filters Type (for search and filtering)
export interface InvoiceFilters {
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  customerIds?: string[];
  invoiceStatus?: string[];
  paymentStatus?: string[];
  isPaid?: boolean;
}

/**
 * Convert a database record to frontend model
 */
export function convertToInvoice(record: GlInvoiceRecord): Invoice {
  return {
    id: record.id,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    glideRowId: record.glide_row_id,
    invoiceUid: record.invoice_uid,
    invoiceDate: record.invoice_date,
    dueDate: record.due_date,
    customerId: record.customer_id,
    invoiceStatus: record.invoice_status,
    paymentStatus: record.payment_status,
    subtotalAmount: record.subtotal_amount,
    discountAmount: record.discount_amount,
    taxAmount: record.tax_amount,
    totalAmount: record.total_amount,
    balanceAmount: record.balance_amount,
    notes: record.notes,
    terms: record.terms,
    isPaid: record.is_paid,
    paymentDate: record.payment_date,
    supabasePdfUrl: record.supabase_pdf_url,
    lastPdfGeneratedAt: record.last_pdf_generated_at,
    invoiceNumber: record.invoice_number,
  };
}

/**
 * Convert frontend model to database record for insert
 */
export function convertToGlInvoiceInsert(invoice: Invoice | InvoiceForm): GlInvoiceInsert {
  return {
    id: 'id' in invoice ? invoice.id : undefined,
    glide_row_id: 'glideRowId' in invoice ? invoice.glideRowId : undefined,
    invoice_uid: invoice.invoiceUid,
    invoice_date: invoice.invoiceDate,
    due_date: invoice.dueDate,
    customer_id: invoice.customerId,
    invoice_status: invoice.invoiceStatus,
    payment_status: invoice.paymentStatus,
    subtotal_amount: invoice.subtotalAmount,
    discount_amount: invoice.discountAmount,
    tax_amount: invoice.taxAmount,
    total_amount: invoice.totalAmount,
    balance_amount: invoice.balanceAmount,
    notes: invoice.notes,
    terms: invoice.terms,
    is_paid: invoice.isPaid,
    payment_date: 'paymentDate' in invoice ? invoice.paymentDate : undefined,
    supabase_pdf_url: 'supabasePdfUrl' in invoice ? invoice.supabasePdfUrl : undefined,
    last_pdf_generated_at: 'lastPdfGeneratedAt' in invoice ? invoice.lastPdfGeneratedAt : undefined,
    invoice_number: 'invoiceNumber' in invoice ? invoice.invoiceNumber : undefined,
  };
}
