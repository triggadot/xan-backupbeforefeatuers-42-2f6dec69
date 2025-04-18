
/**
 * TypeScript types for the gl_customer_credits table from Supabase
 */

// The database record type that exactly matches the Supabase table columns
export interface GlCustomerCreditRecord {
  id: string;
  glide_row_id: string;
  date_of_payment: string | null;
  payment_amount: number | null;
  payment_note: string | null;
  rowid_accounts: string | null;
  rowid_invoices: string | null;
  rowid_estimates: string | null;
  payment_type: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Insert type for creating new customer credit records
export interface GlCustomerCreditInsert {
  glide_row_id: string;
  date_of_payment?: string | null;
  payment_amount?: number | null;
  payment_note?: string | null;
  rowid_accounts?: string | null;
  rowid_invoices?: string | null;
  rowid_estimates?: string | null;
  payment_type?: string | null;
}

// Update type for updating existing customer credit records (all fields optional)
export interface GlCustomerCreditUpdate {
  glide_row_id?: string;
  date_of_payment?: string | null;
  payment_amount?: number | null;
  payment_note?: string | null;
  rowid_accounts?: string | null;
  rowid_invoices?: string | null;
  rowid_estimates?: string | null;
  payment_type?: string | null;
  updated_at?: string;
}

// Frontend model for customer credits (camelCase properties)
export interface CustomerCredit {
  id: string;
  glideRowId: string;
  dateOfPayment: Date | null;
  paymentAmount: number | null;
  paymentNote: string | null;
  accountId: string | null;
  invoiceId: string | null;
  estimateId: string | null;
  paymentType: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;

  // Derived properties
  formattedDate?: string;
  formattedAmount?: string;
}

// Form data for customer credit input
export interface CustomerCreditForm {
  dateOfPayment: Date | null;
  paymentAmount: number | null;
  paymentNote: string | null;
  accountId: string | null;
  invoiceId: string | null;
  estimateId: string | null;
  paymentType: string | null;
}

// Search filters for customer credits
export interface CustomerCreditFilters {
  accountId?: string | null;
  invoiceId?: string | null;
  estimateId?: string | null;
  paymentType?: string | null;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  amountRange?: {
    min: number | null;
    max: number | null;
  };
}

/**
 * Converts a database record to a frontend model
 */
export function convertDbToFrontend(record: GlCustomerCreditRecord): CustomerCredit {
  return {
    id: record.id,
    glideRowId: record.glide_row_id,
    dateOfPayment: record.date_of_payment ? new Date(record.date_of_payment) : null,
    paymentAmount: record.payment_amount,
    paymentNote: record.payment_note,
    accountId: record.rowid_accounts,
    invoiceId: record.rowid_invoices,
    estimateId: record.rowid_estimates,
    paymentType: record.payment_type,
    createdAt: record.created_at ? new Date(record.created_at) : null,
    updatedAt: record.updated_at ? new Date(record.updated_at) : null,

    // Derived properties
    formattedDate: record.date_of_payment ? new Date(record.date_of_payment).toLocaleDateString() : 'N/A',
    formattedAmount: record.payment_amount ?
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(record.payment_amount)
      : '$0.00'
  };
}

/**
 * Converts a frontend model to a database record for insert
 */
export function convertFrontendToDbInsert(model: CustomerCreditForm): GlCustomerCreditInsert {
  return {
    glide_row_id: crypto.randomUUID(), // Generate a new UUID
    date_of_payment: model.dateOfPayment ? model.dateOfPayment.toISOString() : null,
    payment_amount: model.paymentAmount,
    payment_note: model.paymentNote,
    rowid_accounts: model.accountId,
    rowid_invoices: model.invoiceId,
    rowid_estimates: model.estimateId,
    payment_type: model.paymentType
  };
}

/**
 * Converts a frontend model to a database record for update
 */
export function convertFrontendToDbUpdate(model: Partial<CustomerCredit>): GlCustomerCreditUpdate {
  return {
    date_of_payment: model.dateOfPayment ? model.dateOfPayment.toISOString() : undefined,
    payment_amount: model.paymentAmount,
    payment_note: model.paymentNote,
    rowid_accounts: model.accountId,
    rowid_invoices: model.invoiceId,
    rowid_estimates: model.estimateId,
    payment_type: model.paymentType,
    updated_at: new Date().toISOString()
  };
}
