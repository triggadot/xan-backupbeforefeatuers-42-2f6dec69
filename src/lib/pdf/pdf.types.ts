/**
 * @file pdf.types.ts
 * Unified type definitions and utilities for PDF generation system.
 * This file serves as the single source of truth for all PDF-related types.
 */

import { DocumentType, LegacyDocumentTypeString, normalizeDocumentType } from '@/types/documents/pdf.unified';
import { z } from 'zod';

/**
 * Zod schema for validating document types
 */
export const documentTypeSchema = z.nativeEnum(DocumentType);

/**
 * Zod schema for validating legacy document type strings
 */
export const legacyDocumentTypeSchema = z.enum(['invoice', 'purchaseOrder', 'estimate']);

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
export function validateDocumentType(type: string | DocumentType | LegacyDocumentTypeString): DocumentType {
  try {
    // First try to normalize using the unified normalizer
    return normalizeDocumentType(type);
  } catch (error) {
    // If that fails, try to parse with Zod
    try {
      return documentTypeSchema.parse(type);
    } catch (zodError) {
      // If that fails too, throw a clear error
      throw new Error(`Invalid document type: ${type}. Must be one of: ${Object.values(DocumentType).join(', ')}`);
    }
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
