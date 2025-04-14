/**
 * Types for PDF generation system
 * @deprecated Use types from pdf.unified.ts instead for all new development
 */

import { DocumentType as UnifiedDocumentType, PDFErrorType as UnifiedPDFErrorType } from './pdf.unified';

/**
 * @deprecated Use DocumentType from pdf.unified.ts instead
 */
export { UnifiedDocumentType as DocumentType };

/**
 * @deprecated Use PDFErrorType from pdf.unified.ts instead
 */
export { UnifiedPDFErrorType as PDFErrorType };

/**
 * Interface for PDF generation failure
 */
export interface PDFGenerationFailure {
  id: number;
  document_type: string;
  document_id: string;
  error_message: string | null;
  retry_count: number;
  first_attempt: string;
  last_attempt: string;
  next_attempt: string;
  resolved: boolean;
  requires_manual_intervention: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for retry results
 */
export interface RetryResult {
  id: number;
  documentType: string;
  documentId: string;
  success: boolean;
  retryCount: number;
  requiresManualIntervention?: boolean;
  message?: string;
  error?: string;
  url?: string;
}

/**
 * Interface for PDF generation options
 */
export interface PDFGenerationOptions {
  forceRegenerate?: boolean;
  overwriteExisting?: boolean;
}

/**
 * Interface for PDF scan options
 */
export interface PDFScanOptions {
  batchSize?: number;
  forceRegenerate?: boolean;
  overwriteExisting?: boolean;
}

/**
 * Interface for PDF retry options
 */
export interface PDFRetryOptions {
  maxRetries?: number;
  batchSize?: number;
}
