
/**
 * @file pdf.unified.ts
 * Unified type system for PDF-related functionality across the application.
 * This provides a consistent interface for working with different document types.
 */

/**
 * Document type enum - the canonical source of document types
 */
export enum DocumentType {
  INVOICE = 'invoice',
  ESTIMATE = 'estimate',
  PURCHASE_ORDER = 'purchase_order',
  PRODUCT = 'product'
}

/**
 * Legacy document type strings used in older code
 */
export type LegacyDocumentTypeString = 'invoice' | 'estimate' | 'purchaseOrder' | 'product';

/**
 * Configuration for each document type
 */
export interface DocumentTypeConfig {
  tableName: string;        // Database table name
  storageFolder: string;    // Storage folder for PDFs
  idField: string;          // Primary key field
  uidField: string;         // Human-readable ID field (e.g. invoice_uid)
  displayName: string;      // Human-readable name
  pdfUrlField: string;      // Field that stores the PDF URL
  entityType: string;       // Entity type for tracking
  backendKey: string;       // Key used in backend systems
}

/**
 * Configuration for all document types
 */
export const documentTypeConfig: Record<DocumentType, DocumentTypeConfig> = {
  [DocumentType.INVOICE]: {
    tableName: 'gl_invoices',
    storageFolder: 'invoices',
    idField: 'id',
    uidField: 'invoice_uid',
    displayName: 'Invoice',
    pdfUrlField: 'supabase_pdf_url',
    entityType: 'invoice',
    backendKey: 'invoices'
  },
  [DocumentType.ESTIMATE]: {
    tableName: 'gl_estimates',
    storageFolder: 'estimates',
    idField: 'id',
    uidField: 'estimate_uid',
    displayName: 'Estimate',
    pdfUrlField: 'supabase_pdf_url',
    entityType: 'estimate',
    backendKey: 'estimates'
  },
  [DocumentType.PURCHASE_ORDER]: {
    tableName: 'gl_purchase_orders',
    storageFolder: 'purchase_orders',
    idField: 'id',
    uidField: 'purchase_order_uid',
    displayName: 'Purchase Order',
    pdfUrlField: 'supabase_pdf_url',
    entityType: 'purchase_order',
    backendKey: 'purchase_orders'
  },
  [DocumentType.PRODUCT]: {
    tableName: 'gl_products',
    storageFolder: 'products',
    idField: 'id',
    uidField: 'product_sku',
    displayName: 'Product',
    pdfUrlField: 'supabase_pdf_url',
    entityType: 'product',
    backendKey: 'products'
  }
};

/**
 * Normalize a document type string to the DocumentType enum
 */
export function normalizeDocumentType(type: string | DocumentType): DocumentType {
  if (typeof type === 'string') {
    // Check if it's already a valid DocumentType value
    if (Object.values(DocumentType).includes(type as DocumentType)) {
      return type as DocumentType;
    }
    
    // Check if it's a legacy format
    switch (type.toLowerCase()) {
      case 'invoice':
        return DocumentType.INVOICE;
      case 'estimate':
        return DocumentType.ESTIMATE;
      case 'purchaseorder':
      case 'purchase_order':
      case 'purchase order':
        return DocumentType.PURCHASE_ORDER;
      case 'product':
        return DocumentType.PRODUCT;
      default:
        throw new Error(`Unknown document type: ${type}`);
    }
  }
  
  return type;
}

/**
 * Convert DocumentType to legacy string format used in older code
 */
export function toLegacyDocumentTypeString(type: DocumentType | string): LegacyDocumentTypeString {
  const normalizedType = normalizeDocumentType(type);
  
  switch (normalizedType) {
    case DocumentType.INVOICE:
      return 'invoice';
    case DocumentType.ESTIMATE:
      return 'estimate';
    case DocumentType.PURCHASE_ORDER:
      return 'purchaseOrder';
    case DocumentType.PRODUCT:
      return 'product';
    default:
      throw new Error(`Unable to convert to legacy document type: ${type}`);
  }
}

/**
 * Get database table name for document type
 */
export function getTableNameForType(type: DocumentType | string): string {
  const normalizedType = normalizeDocumentType(type);
  return documentTypeConfig[normalizedType].tableName;
}

/**
 * Get backend document type key used in edge functions
 */
export function getBackendDocumentTypeKey(type: DocumentType | string): string {
  const normalizedType = normalizeDocumentType(type);
  return documentTypeConfig[normalizedType].backendKey;
}

/**
 * Get storage folder name for document type
 */
export function getStorageDocumentTypeKey(type: DocumentType | string): string {
  const normalizedType = normalizeDocumentType(type);
  return documentTypeConfig[normalizedType].storageFolder;
}

/**
 * Get batch processing document type key
 */
export function getBatchDocumentTypeKey(type: DocumentType | string): string {
  const normalizedType = normalizeDocumentType(type);
  return documentTypeConfig[normalizedType].backendKey;
}

/**
 * Get human-readable display name for document type
 */
export function getDisplayNameForType(type: DocumentType | string): string {
  const normalizedType = normalizeDocumentType(type);
  return documentTypeConfig[normalizedType].displayName;
}
