
export enum DocumentType {
  INVOICE = 'invoice',
  ESTIMATE = 'estimate',
  PURCHASE_ORDER = 'purchase_order'
}

export interface PDFGenerationOptions {
  forceRegenerate?: boolean;
  download?: boolean;
  filename?: string;
}

export interface PDFGenerationResult {
  success: boolean;
  url?: string;
  error?: string;
  documentId?: string;
  documentType?: DocumentType;
}

/**
 * Validates and normalizes a document type
 * @param type Document type to validate
 * @returns Normalized DocumentType enum value
 */
export function validateDocumentType(type: string | DocumentType): DocumentType {
  if (typeof type === 'string') {
    const normalizedType = type.toLowerCase();
    switch (normalizedType) {
      case 'invoice': return DocumentType.INVOICE;
      case 'estimate': return DocumentType.ESTIMATE;
      case 'purchaseorder':
      case 'purchase_order':
      case 'purchase order':
        return DocumentType.PURCHASE_ORDER;
      default:
        throw new Error(`Invalid document type: ${type}`);
    }
  }
  return type;
}

/**
 * Convert DocumentType to legacy string format
 * @param type DocumentType to convert
 * @returns Legacy string representation of document type
 */
export function toLegacyDocumentTypeString(type: DocumentType): 'invoice' | 'estimate' | 'purchaseOrder' {
  switch (type) {
    case DocumentType.INVOICE: return 'invoice';
    case DocumentType.ESTIMATE: return 'estimate';
    case DocumentType.PURCHASE_ORDER: return 'purchaseOrder';
    default: return 'invoice';
  }
}
