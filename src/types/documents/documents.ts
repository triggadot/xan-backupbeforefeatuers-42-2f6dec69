import { DocumentType, normalizeDocumentType as unifiedNormalizeDocumentType, getBackendDocumentTypeKey, documentTypeConfig } from './pdf.unified';

/**
 * Helper function to get document type configuration
 * @param type Document type
 * @returns Document type configuration
 */
function getDocumentTypeConfig(type: DocumentType) {
  return documentTypeConfig[type];
}

/**
 * @deprecated Use DocumentType from pdf.unified.ts instead
 */
export { DocumentType };

/**
 * Normalizes document type names to ensure consistency across the application
 * @param documentType The document type to normalize
 * @returns Normalized document type string
 * @deprecated Use normalizeDocumentType from pdf.unified.ts instead
 */
export function normalizeDocumentType(documentType: DocumentType | string): string {
  try {
    // Use the unified implementation and convert to string
    const normalized = unifiedNormalizeDocumentType(documentType);
    return normalized.toLowerCase();
  } catch (error) {
    console.warn(`Error normalizing document type: ${documentType}`, error);
    return String(documentType).toLowerCase();
  }
}

/**
 * Returns the storage document type key used in PDF storage paths
 * @param documentType The document type
 * @returns The storage document type key
 * @deprecated Use documentTypeConfig from pdf.unified.ts instead
 */
export function getStorageDocumentTypeKey(documentType: DocumentType | string): string {
  try {
    // Use the unified implementation
    const normalized = unifiedNormalizeDocumentType(documentType);
    const config = getDocumentTypeConfig(normalized);
    return config.storageFolder.toLowerCase();
  } catch (error) {
    console.warn(`Error getting storage document type key: ${documentType}`, error);
    // Fallback to legacy implementation
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
}

/**
 * Returns the batch document type key used in PDF batch operations
 * @param documentType The document type
 * @returns The batch document type key
 * @deprecated Use getBackendDocumentTypeKey from pdf.unified.ts instead
 */
export function getBatchDocumentTypeKey(documentType: DocumentType | string): string {
  try {
    // For batch operations, we need the backend key format
    return getBackendDocumentTypeKey(documentType);
  } catch (error) {
    console.warn(`Error getting batch document type key: ${documentType}`, error);
    // Fallback to legacy implementation
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
}
