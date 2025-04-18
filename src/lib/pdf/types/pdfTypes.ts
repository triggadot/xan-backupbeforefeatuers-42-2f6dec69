
/**
 * @file pdfTypes.ts
 * Unified type definitions for PDF generation system.
 * This file serves as the single source of truth for all PDF-related types.
 */

import { DocumentType } from '@/types/documents/pdf.unified';
import { z } from 'zod';

/**
 * PDF generation options
 */
export interface PDFGenerationOptions {
  /** Whether to force regeneration even if PDF already exists */
  forceRegenerate?: boolean;
  /** Whether to download the PDF after generation */
  download?: boolean;
  /** Custom filename for downloaded PDF */
  filename?: string;
  /** Project ID for Supabase function calls */
  projectId?: string;
}

/**
 * Default options for PDF generation
 */
export const DEFAULT_PDF_OPTIONS: PDFGenerationOptions = {
  forceRegenerate: false,
  download: false,
  projectId: 'swrfsullhirscyxqneay' // Explicit project ID per Glide sync pattern
};

/**
 * PDF generation result
 */
export interface PDFGenerationResult {
  /** Whether the operation was successful */
  success: boolean;
  /** URL of the generated PDF */
  url?: string;
  /** Error message if operation failed */
  error?: string;
  /** Document ID */
  documentId?: string;
  /** Document type */
  documentType?: DocumentType;
}

/**
 * Validates and normalizes a document type
 * @param type Document type to validate
 * @returns Normalized DocumentType enum value
 * @throws Error if type is invalid
 */
export function validateDocumentType(type: string | DocumentType): DocumentType {
  try {
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
  } catch (error) {
    throw new Error(`Invalid document type: ${type}. Must be one of: ${Object.values(DocumentType).join(', ')}`);
  }
}

/**
 * Validates PDF generation options
 * @param options Options to validate
 * @returns Validated and normalized options
 */
export function validatePDFOptions(options?: Partial<PDFGenerationOptions>): PDFGenerationOptions {
  return {
    ...DEFAULT_PDF_OPTIONS,
    ...(options || {})
  };
}

/**
 * Document types for backwards compatibility
 */
export type LegacyDocumentTypeString = 'invoice' | 'estimate' | 'purchaseOrder' | 'product';

/**
 * Zod schema for validating document types
 */
export const documentTypeSchema = z.nativeEnum(DocumentType);

/**
 * Zod schema for validating legacy document type strings
 */
export const legacyDocumentTypeSchema = z.enum(['invoice', 'purchaseOrder', 'estimate', 'product']);
