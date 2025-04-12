
/**
 * Supported document types for PDF generation and operations
 */
export enum DocumentType {
  INVOICE = 'invoice',
  ESTIMATE = 'estimate',
  PURCHASE_ORDER = 'purchase_order'
}

/**
 * Normalizes document type names to ensure consistency across the application
 * @param documentType The document type to normalize
 * @returns Normalized document type string
 */
export function normalizeDocumentType(documentType: DocumentType | string): string {
  // Convert to lowercase
  const lowercased = typeof documentType === 'string' ? documentType.toLowerCase() : documentType;
  
  // Handle special cases and aliases
  switch (lowercased) {
    case 'invoice':
    case 'invoices':
      return 'invoice';
    case 'estimate':
    case 'estimates':
    case 'quote':
    case 'quotes':
      return 'estimate';
    case 'purchase_order':
    case 'purchaseorder':
    case 'purchase-order':
    case 'po':
      return 'purchase_order';
    default:
      console.warn(`Unknown document type: ${documentType}, using as-is`);
      return typeof lowercased === 'string' ? lowercased : 'unknown';
  }
}

/**
 * Returns the storage document type key used in Supabase storage
 * @param documentType The document type
 * @returns The storage document type key
 */
export function getStorageDocumentTypeKey(documentType: DocumentType | string): string {
  const normalizedType = normalizeDocumentType(documentType);
  
  switch (normalizedType) {
    case 'invoice':
      return 'invoices';
    case 'estimate':
      return 'estimates';
    case 'purchase_order':
      return 'purchase-orders';
    default:
      return normalizedType;
  }
}

/**
 * Returns the batch document type key used in PDF batch operations
 * @param documentType The document type
 * @returns The batch document type key
 */
export function getBatchDocumentTypeKey(documentType: DocumentType | string): string {
  const normalizedType = normalizeDocumentType(documentType);
  
  switch (normalizedType) {
    case 'invoice':
      return 'invoice';
    case 'estimate':
      return 'estimate';
    case 'purchase_order':
      return 'purchase-order'; // Note the hyphen format for batch operations
    default:
      return normalizedType;
  }
}
