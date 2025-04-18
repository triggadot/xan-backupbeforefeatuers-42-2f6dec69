
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
