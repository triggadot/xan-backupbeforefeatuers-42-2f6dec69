/**
 * Shared types for the batch-generate-and-store-pdfs edge function
 */

/**
 * Supported document types for PDF generation
 */
export enum DocumentType {
  INVOICE = 'invoice',
  ESTIMATE = 'estimate',
  PURCHASE_ORDER = 'purchaseOrder',
}

/**
 * Document type mapping configuration
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
 * Map of document type aliases to normalized document types
 */
export const documentTypeAliases: Record<string, DocumentType> = {
  // Invoice aliases
  'invoice': DocumentType.INVOICE,
  'invoices': DocumentType.INVOICE,
  'inv': DocumentType.INVOICE,
  
  // Purchase Order aliases
  'purchase-order': DocumentType.PURCHASE_ORDER,
  'purchase_order': DocumentType.PURCHASE_ORDER,
  'purchaseorder': DocumentType.PURCHASE_ORDER,
  'purchaseOrder': DocumentType.PURCHASE_ORDER,
  'purchase-orders': DocumentType.PURCHASE_ORDER,
  'purchase_orders': DocumentType.PURCHASE_ORDER,
  'purchaseorders': DocumentType.PURCHASE_ORDER,
  'po': DocumentType.PURCHASE_ORDER,
  
  // Estimate aliases
  'estimate': DocumentType.ESTIMATE,
  'estimates': DocumentType.ESTIMATE,
  'est': DocumentType.ESTIMATE,
  'sample': DocumentType.ESTIMATE,
  'samples': DocumentType.ESTIMATE
};

/**
 * Configuration for each document type including table names and field mappings
 * Following the Glidebase pattern of using glide_row_id for relationships
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
        tableName: 'gl_customer_payments',
        referenceField: 'rowid_invoices',
      },
    ],
  },
  [DocumentType.PURCHASE_ORDER]: {
    tableName: 'gl_purchase_orders',
    linesTableName: 'gl_products',
    uidField: 'purchase_order_uid',
    accountRefField: 'rowid_accounts',
    storageFolder: 'PurchaseOrders',
    additionalRelations: [
      {
        tableName: 'gl_vendor_payments',
        referenceField: 'rowid_purchase_orders',
      },
    ],
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
        referenceField: 'rowid_estimates',
      },
    ],
  },
};

/**
 * Data structure expected by the batch process
 */
export interface BatchPDFItem {
  id: string;
  type: string;
}

/**
 * Result of batch processing of a single item
 */
export interface BatchPDFItemResult {
  id: string;
  type: string; 
  success: boolean;
  error?: string;
  url?: string | null;
}

/**
 * Final result of batch processing
 */
export interface BatchPDFResult {
  results: BatchPDFItemResult[];
  errors?: string[];
  success: boolean;
}
