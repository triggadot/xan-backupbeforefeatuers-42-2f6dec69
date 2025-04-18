
/**
 * @file pdf.unified.ts 
 * Unified type definitions for PDF functionality
 */

export enum DocumentType {
  INVOICE = 'invoice',
  ESTIMATE = 'estimate',
  PURCHASE_ORDER = 'purchase_order',
  PRODUCT = 'product'
}

export interface PDFMetadata {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  createdAt: Date;
}

export interface PDFGenerationOptions {
  forceRegenerate?: boolean;
  download?: boolean;
  filename?: string;
  metadata?: PDFMetadata;
}

export interface PDFGenerationResult {
  success: boolean;
  url?: string;
  error?: string;
  documentId?: string;
  documentType?: DocumentType;
}

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
      case 'product': return DocumentType.PRODUCT;
      default:
        throw new Error(`Invalid document type: ${type}`);
    }
  }
  return type;
}
