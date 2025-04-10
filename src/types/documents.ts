/**
 * Document types supported for PDF generation in the application
 * 
 * @remarks
 * This enum provides consistent naming across the frontend and backend.
 * When passing to backend functions, use the corresponding mapping functions
 * to ensure proper format.
 */
export enum DocumentType {
  INVOICE = 'invoice',
  PURCHASE_ORDER = 'purchaseOrder',
  ESTIMATE = 'estimate',
  PRODUCT = 'product',
}

/**
 * Maps frontend document types to their corresponding API format keys
 *
 * @remarks
 * Used for consistency in API communication between frontend and backend.
 * Some backend endpoints may require different formats of the same document type.
 */
export interface DocumentTypeMapping {
  /** Key used for batch operations */
  batchKey: string;
  /** Key used for storage operations */
  storageKey: string;
  /** Key used for URL formatting */
  urlKey: string;
  /** Display name for UI */
  displayName: string;
}

/**
 * Document type mappings for different operations in the system
 * 
 * @example
 * ```ts
 * // Get batch key for invoice
 * const batchKey = DOCUMENT_TYPE_MAPPINGS[DocumentType.INVOICE].batchKey;
 * // Returns 'invoice'
 * ```
 */
export const DOCUMENT_TYPE_MAPPINGS: Record<DocumentType, DocumentTypeMapping> = {
  [DocumentType.INVOICE]: {
    batchKey: 'invoice',
    storageKey: 'invoice',
    urlKey: 'invoice',
    displayName: 'Invoice'
  },
  [DocumentType.PURCHASE_ORDER]: {
    batchKey: 'purchaseOrder',
    storageKey: 'purchase-order',
    urlKey: 'purchase-order',
    displayName: 'Purchase Order'
  },
  [DocumentType.ESTIMATE]: {
    batchKey: 'estimate',
    storageKey: 'estimate',
    urlKey: 'estimate',
    displayName: 'Estimate'
  },
  [DocumentType.PRODUCT]: {
    batchKey: 'product',
    storageKey: 'product',
    urlKey: 'product',
    displayName: 'Product'
  }
};

/**
 * Normalizes document type string to ensure consistent handling across the application
 *
 * @param type - Document type string in any supported format
 * @returns Normalized DocumentType enum value
 * 
 * @example
 * ```ts
 * normalizeDocumentType('purchase-order') // Returns DocumentType.PURCHASE_ORDER
 * normalizeDocumentType('INVOICE') // Returns DocumentType.INVOICE
 * ```
 */
export function normalizeDocumentType(type: string): DocumentType {
  // Convert to lowercase for case-insensitive comparison
  const normalizedType = type.toLowerCase();

  // Handle various formats of purchase order
  if (
    normalizedType === 'purchaseorder' ||
    normalizedType === 'purchase-order' ||
    normalizedType === 'purchase_order'
  ) {
    return DocumentType.PURCHASE_ORDER;
  }

  // Find matching enum value
  const match = Object.values(DocumentType).find(
    docType => docType.toLowerCase() === normalizedType
  );

  if (match) {
    return match as DocumentType;
  }

  // Fallback or error handling
  throw new Error(`Unsupported document type: ${type}`);
}

/**
 * Get the appropriate document type key for batch operations
 *
 * @param type - Document type enum value or string
 * @returns The corresponding batch operation key
 */
export function getBatchDocumentTypeKey(type: DocumentType | string): string {
  const docType = typeof type === 'string' ? normalizeDocumentType(type) : type;
  return DOCUMENT_TYPE_MAPPINGS[docType].batchKey;
}

/**
 * Get the appropriate document type key for storage operations
 *
 * @param type - Document type enum value or string
 * @returns The corresponding storage operation key
 */
export function getStorageDocumentTypeKey(type: DocumentType | string): string {
  const docType = typeof type === 'string' ? normalizeDocumentType(type) : type;
  return DOCUMENT_TYPE_MAPPINGS[docType].storageKey;
}

/**
 * Get the display name for a document type
 *
 * @param type - Document type enum value or string
 * @returns Human-readable display name for the document type
 */
export function getDocumentTypeDisplayName(type: DocumentType | string): string {
  const docType = typeof type === 'string' ? normalizeDocumentType(type) : type;
  return DOCUMENT_TYPE_MAPPINGS[docType].displayName;
}
