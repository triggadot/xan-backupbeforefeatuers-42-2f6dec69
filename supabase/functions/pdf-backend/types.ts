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
  PURCHASE_ORDER = 'purchaseorder',
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
    linesTableName: 'gl_purchase_order_lines',
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
  'invoice': DocumentType.INVOICE,
  'invoices': DocumentType.INVOICE,

  'estimate': DocumentType.ESTIMATE,
  'estimates': DocumentType.ESTIMATE,

  'purchaseorder': DocumentType.PURCHASE_ORDER,
  'purchaseorders': DocumentType.PURCHASE_ORDER,
  'purchase-order': DocumentType.PURCHASE_ORDER,
  'purchase-orders': DocumentType.PURCHASE_ORDER,
  'purchase_order': DocumentType.PURCHASE_ORDER,
  'purchase_orders': DocumentType.PURCHASE_ORDER,
  'po': DocumentType.PURCHASE_ORDER,
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

  // Normalize to lowercase with special characters removed
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
  product_name_display?: string;
  renamed_product_name?: string;
  quantity?: number;
  price?: number;
  total?: number;
  product?: {
    vendor_product_name?: string;
    new_product_name?: string;
  };
}

/**
 * Interface for invoice data
 * @interface Invoice
 */
export interface Invoice {
  id: string;
  glide_row_id?: string;
  invoice_uid?: string;
  invoice_order_date?: string;
  invoice_ship_date?: string;
  status?: string;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  shipping_cost?: number;
  invoice_notes?: string;
  payment_terms?: string;
  account?: Account;
  lines?: InvoiceLine[];
  customer_payments?: Array<{
    id: string;
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
  quantity?: number;
  unitPrice?: number;
  total?: number;
  description?: string;
  productId?: string;
  product_name?: string;
  new_product_name?: string;
  vendor_product_name?: string;
  display_name?: string;
  unit_price?: number;
  notes?: string;
  samples?: boolean;
  fronted?: boolean;
  category?: string;
  total_units?: number;
}

/**
 * Interface for purchase order data
 * @interface PurchaseOrder
 */
export interface PurchaseOrder {
  id: string;
  glide_row_id?: string;
  purchase_order_uid?: string;
  po_date?: string;
  po_status?: string;
  po_notes?: string;
  shipping_cost?: number;
  total_amount?: number;
  balance?: number;
  account?: Account;
  lineItems?: PurchaseOrderLineItem[];
  vendorPayments?: Array<{
    id: string;
    amount?: number;
    date?: string;
    method?: string;
    notes?: string;
  }>;
}

/**
 * Interface for estimate line items
 * @interface EstimateLine
 */
export interface EstimateLine {
  id: string;
  glide_row_id?: string;
  product_name_display?: string;
  quantity?: number;
  price?: number;
  total?: number;
  product?: {
    vendor_product_name?: string;
    new_product_name?: string;
  };
}

/**
 * Interface for estimate data
 * @interface Estimate
 */
export interface Estimate {
  id: string;
  glide_row_id?: string;
  estimate_uid?: string;
  estimate_date?: string;
  status?: string;
  is_a_sample?: boolean;
  total_amount?: number;
  balance?: number;
  estimate_notes?: string;
  account?: Account;
  lines?: EstimateLine[];
  customer_credits?: Array<{
    id: string;
    payment_amount?: number;
    date_of_payment?: string;
    payment_type?: string;
    payment_note?: string;
  }>;
}
