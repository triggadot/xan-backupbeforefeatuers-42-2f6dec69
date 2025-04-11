
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
/**
 * Document type mappings for different operations in the system
 * Standardized to match backend expectations
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
    batchKey: 'invoice', // Must match backend DocumentType.INVOICE value
    storageKey: 'invoice',
    urlKey: 'invoice',
    displayName: 'Invoice'
  },
  [DocumentType.PURCHASE_ORDER]: {
    batchKey: 'purchaseorder', // Updated to match backend DocumentType.PURCHASE_ORDER value
    storageKey: 'purchase-order',
    urlKey: 'purchase-order',
    displayName: 'Purchase Order'
  },
  [DocumentType.ESTIMATE]: {
    batchKey: 'estimate', // Must match backend DocumentType.ESTIMATE value
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
  if (!type) {
    throw new Error('Document type cannot be empty');
  }

  // Convert to lowercase and trim for case-insensitive comparison
  const normalizedType = type.toLowerCase().trim();

  // Handle specific cases for different document types with special handling
  // for consistent normalization with backend
  
  // Invoice variations
  if (normalizedType === 'invoice' || normalizedType === 'invoices') {
    return DocumentType.INVOICE;
  }
  
  // Purchase order variations
  if (
    normalizedType === 'purchaseorder' ||
    normalizedType === 'purchase-order' ||
    normalizedType === 'purchase_order' ||
    normalizedType === 'purchaseorders' ||
    normalizedType === 'purchase-orders' ||
    normalizedType === 'purchase_orders' ||
    normalizedType === 'po'
  ) {
    return DocumentType.PURCHASE_ORDER;
  }
  
  // Estimate variations
  if (normalizedType === 'estimate' || normalizedType === 'estimates') {
    return DocumentType.ESTIMATE;
  }
  
  // Product variations
  if (normalizedType === 'product' || normalizedType === 'products') {
    return DocumentType.PRODUCT;
  }

  // Find matching enum value as fallback
  const match = Object.values(DocumentType).find(
    docType => docType.toLowerCase() === normalizedType
  );

  if (match) {
    return match as DocumentType;
  }

  // Error if no match found
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
