/**
 * Document types supported by the PDF generation system
 * @enum {string}
 */
export enum DocumentType {
  /** Invoice document type */
  INVOICE = 'invoice',
  /** Estimate document type */
  ESTIMATE = 'estimate',
  /** Purchase order document type */
  PURCHASE_ORDER = 'purchase_order',
}

/**
 * Document type configuration for database interactions and storage
 * @interface DocumentTypeConfig
 */
export interface DocumentTypeConfig {
  /** Table name for the main document */
  tableName: string;
  /** Table name for line items if any */
  linesTableName?: string;
  /** Field to use for the filename */
  uidField: string;
  /** Field referencing the account (using Glidebase pattern) */
  accountRefField: string;
  /** Storage folder path */
  storageFolder: string;
  /** Additional relations for specific document types */
  additionalRelations?: {
    /** Table name of the related entity */
    tableName: string;
    /** Field in the related entity referencing the document */
    referenceField: string;
  }[];
}

/**
 * Configuration for each document type including table names and field mappings
 * Following the Glidebase pattern of using glide_row_id for relationships
 * @type {Record<DocumentType, DocumentTypeConfig>}
 */
export const documentTypeConfig: Record<DocumentType, DocumentTypeConfig> = {
  [DocumentType.INVOICE]: {
    tableName: 'gl_invoices',
    linesTableName: 'gl_invoice_lines',
    uidField: 'invoice_uid',
    accountRefField: 'rowid_accounts',
    storageFolder: 'Invoices',
    additionalRelations: [
      {
        tableName: 'gl_shipping_records',
        referenceField: 'rowid_invoices'
      },
      {
        tableName: 'gl_customer_payments',
        referenceField: 'rowid_invoices'
      }
    ]
  },
  [DocumentType.ESTIMATE]: {
    tableName: 'gl_estimates',
    linesTableName: 'gl_estimate_lines',
    uidField: 'estimate_uid',
    accountRefField: 'rowid_accounts',
    storageFolder: 'Estimates',
    additionalRelations: [
      {
        tableName: 'gl_customer_credits',
        referenceField: 'rowid_estimates'
      }
    ]
  },
  [DocumentType.PURCHASE_ORDER]: {
    tableName: 'gl_purchase_orders',
    linesTableName: 'gl_products', // Products serve as PO line items
    uidField: 'purchase_order_uid',
    accountRefField: 'rowid_accounts',
    storageFolder: 'PurchaseOrders',
    additionalRelations: [
      {
        tableName: 'gl_vendor_payments',
        referenceField: 'rowid_purchase_orders'
      }
    ]
  }
};

/**
 * Mapping for alternative document type formats to standardized enum
 * @type {Record<string, DocumentType>}
 */
export const documentTypeAliases: Record<string, DocumentType> = {
  // Invoice aliases
  'invoice': DocumentType.INVOICE,
  'invoices': DocumentType.INVOICE,
  'inv': DocumentType.INVOICE,
  'bill': DocumentType.INVOICE,
  'bills': DocumentType.INVOICE,

  // Estimate aliases
  'estimate': DocumentType.ESTIMATE,
  'estimates': DocumentType.ESTIMATE,
  'est': DocumentType.ESTIMATE,
  'quote': DocumentType.ESTIMATE,
  'quotes': DocumentType.ESTIMATE,

  // Purchase order aliases
  'purchaseorder': DocumentType.PURCHASE_ORDER,
  'purchaseorders': DocumentType.PURCHASE_ORDER,
  'purchase-order': DocumentType.PURCHASE_ORDER,
  'purchase-orders': DocumentType.PURCHASE_ORDER,
  'purchase_order': DocumentType.PURCHASE_ORDER,
  'purchase_orders': DocumentType.PURCHASE_ORDER,
  'po': DocumentType.PURCHASE_ORDER,
  'pos': DocumentType.PURCHASE_ORDER,
};

/**
 * Standardizes document type format for internal processing.
 * Converts various input strings (case-insensitive, with/without plurals/hyphens)
 * into a standard DocumentType enum value using the documentTypeAliases map.
 * 
 * @param {string} type - The document type string to normalize (case-insensitive).
 * @returns {DocumentType} Normalized DocumentType enum value.
 * @throws {Error} If the type is empty, null, or not found in the aliases map.
 * 
 * @example
 * const normalized = normalizeDocumentType('Invoices');
 * // normalized will be DocumentType.INVOICE
 * 
 * @example
 * normalizeDocumentType('purchase-order');
 * // returns DocumentType.PURCHASE_ORDER
 */
export function normalizeDocumentType(type: string): DocumentType {
  if (!type) {
    throw new Error('Document type cannot be empty');
  }

  const normalizedType = type.toLowerCase().trim();
  
  // Check if it's a direct enum value
  if (Object.values(DocumentType).includes(normalizedType as DocumentType)) {
    return normalizedType as DocumentType;
  }
  
  // Look up in aliases
  if (documentTypeAliases[normalizedType]) {
    return documentTypeAliases[normalizedType];
  }
  
  // Not found
  throw new Error(`Unsupported document type: ${type}`);
}

/**
 * Interface for PDF operation result
 * @interface PDFOperationResult
 */
export interface PDFOperationResult {
  success: boolean;
  url?: string;
  error?: string;
  message?: string;
}

/**
 * Interface for PDF error
 * @interface PDFError
 */
export interface PDFError extends PDFOperationResult {
  success: false;
  error: string;
  message?: string;
}

/**
 * Interface for PDF success
 * @interface PDFSuccess
 */
export interface PDFSuccess extends PDFOperationResult {
  success: true;
  url: string;
  message?: string;
}

/**
 * Base interface for account data
 * @interface Account
 */
export interface Account {
  id: string;
  glide_row_id?: string;
  account_name?: string;
  account_uid?: string;
  account_address?: string;
  account_city?: string;
  account_state?: string;
  account_zip?: string;
  account_email?: string;
  account_phone?: string;
}

/**
 * Interface for invoice line items
 * @interface InvoiceLine
 */
export interface InvoiceLine {
  id: string;
  glide_row_id?: string;
  rowid_invoices?: string;
  rowid_products?: string;
  product_name_display?: string;
  renamed_product_name?: string;
  qty_sold?: number; // Database uses qty_sold, not quantity
  price_sold?: number; // Database uses price_sold, not price
  line_total?: number; // Database uses line_total, not total
  product?: {
    vendor_product_name?: string;
    new_product_name?: string;
    display_name?: string;
  };
}

/**
 * Interface for invoice data
 * @interface Invoice
 */
export interface Invoice {
  id: string;
  glide_row_id?: string;
  rowid_accounts?: string;
  invoice_uid?: string;
  invoice_order_date?: string;
  notes?: string;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  payment_status?: string;
  supabase_pdf_url?: string;
  processed?: boolean;
  created_at?: string;
  updated_at?: string;
  // Tax fields
  tax_rate?: number; // Added since used in PDF generation
  tax_amount?: number; // Calculated field
  subtotal?: number; // Calculated field
  // Joined relations
  account?: Account;
  lines?: InvoiceLine[];
  customer_payments?: Array<{
    id: string;
    glide_row_id?: string;
    payment_amount?: number;
    date_of_payment?: string;
    type_of_payment?: string;
    payment_note?: string;
  }>;
}

/**
 * Interface for purchase order line items
 * @interface PurchaseOrderLineItem
 */
export interface PurchaseOrderLineItem {
  id: string;
  glide_row_id?: string;
  rowid_purchase_orders?: string;
  total_qty_purchased?: number; // Actual DB field for quantity
  cost?: number; // Actual DB field for unit price
  line_total?: number; // Calculated field
  purchase_notes?: string; // Notes field
  vendor_product_name?: string;
  new_product_name?: string;
  display_name?: string; // Generated column in DB
  samples?: boolean;
  fronted?: boolean;
  category?: string;
  product_purchase_date?: string;
}

/**
 * Interface for purchase order data
 * @interface PurchaseOrder
 */
export interface PurchaseOrder {
  id: string;
  glide_row_id?: string;
  rowid_accounts?: string;
  purchase_order_uid?: string;
  po_date?: string;
  docs_shortlink?: string;
  pdf_link?: string;
  payment_status?: string;
  product_count?: number;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  supabase_pdf_url?: string;
  created_at?: string;
  updated_at?: string;
  // For PDF generation
  tax_rate?: number;
  tax_amount?: number;
  subtotal?: number;
  po_notes?: string;
  // Joined relations
  account?: Account;
  lineItems?: PurchaseOrderLineItem[];
  vendorPayments?: Array<{
    id: string;
    glide_row_id?: string;
    payment_amount?: number;
    date_of_payment?: string;
    date_of_purchase_order?: string;
    vendor_purchase_note?: string;
  }>;
}

/**
 * Interface for estimate line items
 * @interface EstimateLine
 */
export interface EstimateLine {
  id: string;
  glide_row_id?: string;
  rowid_estimates?: string;
  rowid_products?: string;
  product_name_display?: string;
  qty_sold?: number; // Database uses qty_sold, not quantity
  price_sold?: number; // Database uses price_sold, not price
  line_total?: number; // Database uses line_total, not total
  product_sale_note?: string;
  product?: {
    vendor_product_name?: string;
    new_product_name?: string;
    display_name?: string;
  };
}

/**
 * Interface for estimate data
 * @interface Estimate
 */
export interface Estimate {
  id: string;
  glide_row_id?: string;
  rowid_accounts?: string;
  rowid_invoices?: string;
  estimate_uid?: string;
  estimate_date?: string;
  status?: string;
  is_a_sample?: boolean;
  add_note?: boolean;
  valid_final_create_invoice_clicked?: boolean;
  glide_pdf_url?: string;
  glide_pdf_url2?: string;
  notes?: string;
  total_amount?: number;
  total_credits?: number;
  balance?: number;
  supabase_pdf_url?: string;
  created_at?: string;
  updated_at?: string;
  // For PDF generation
  tax_rate?: number;
  tax_amount?: number;
  subtotal?: number;
  terms?: string;
  // Joined relations
  account?: Account;
  lines?: EstimateLine[];
  customer_credits?: Array<{
    id: string;
    glide_row_id?: string;
    payment_amount?: number;
    date_of_payment?: string;
    payment_type?: string;
    payment_note?: string;
  }>;
}
