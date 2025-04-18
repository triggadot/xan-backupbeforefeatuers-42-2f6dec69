
/**
 * Unified type definitions for PDF functionality across the application
 */

// Document types that can be generated as PDFs
export enum DocumentType {
  INVOICE = 'invoice',
  ESTIMATE = 'estimate',
  PURCHASE_ORDER = 'purchase_order',
  PRODUCT = 'product'
}

// Legacy document type strings for backward compatibility
export type LegacyDocumentTypeString = 'invoice' | 'estimate' | 'purchaseOrder' | 'product';

/**
 * Convert document type enum to legacy string format
 * @param type DocumentType enum or string 
 * @returns Legacy document type string
 */
export function toLegacyDocumentTypeString(type: DocumentType | string): LegacyDocumentTypeString {
  if (typeof type === 'string') {
    switch (type.toLowerCase()) {
      case 'invoice': return 'invoice';
      case 'estimate': return 'estimate';
      case 'purchase_order':
      case 'purchaseOrder':
      case 'purchase-order': 
        return 'purchaseOrder';
      case 'product': return 'product';
      default: return 'invoice'; // Default fallback
    }
  }
  
  switch (type) {
    case DocumentType.INVOICE: return 'invoice';
    case DocumentType.ESTIMATE: return 'estimate';
    case DocumentType.PURCHASE_ORDER: return 'purchaseOrder';
    case DocumentType.PRODUCT: return 'product';
  }
}

// Options for PDF generation
export interface PDFGenerationOptions {
  forceRegenerate?: boolean;
  download?: boolean;
  filename?: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
  overwriteExisting?: boolean;
}

// Result of PDF generation operation
export interface PDFGenerationResult {
  success: boolean;
  url?: string;
  error?: string;
  documentId?: string;
  documentType?: DocumentType;
}
